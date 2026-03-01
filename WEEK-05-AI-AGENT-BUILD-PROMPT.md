# AI Agent Prompt: Build Week 5 - AI Assistant with RAG System

## 🎯 Your Mission
You are an expert AI developer. Build a complete AI Assistant with RAG (Retrieval Augmented Generation) system for StudySync AI platform. Follow each step sequentially. Do not skip steps.

---

## 📋 Prerequisites Check
Before starting, verify:
- [ ] Week 1-4 are complete (Foundation, Auth, Dashboard, Materials)
- [ ] Materials upload system works (cloud storage)
- [ ] User authentication is functional
- [ ] PostgreSQL database is running
- [ ] You have access to:
  - OpenAI API key
  - Supabase account (or can create one)
  - Development environment setup

---

## 🚀 PHASE 1: Setup & Dependencies (Day 1)

### Step 1.1: Install All Required Packages

```bash
# Core AI packages
npm install openai@^4.28.0
npm install ai@^3.0.0

# LangChain ecosystem
npm install langchain@^0.1.25
npm install @langchain/openai@^0.0.19
npm install @langchain/community@^0.0.28

# Vector database
npm install @supabase/supabase-js@^2.39.0

# Document processing
npm install pdf-parse@^1.1.1
npm install mammoth@^1.6.0
npm install pdfjs-dist@^4.0.379

# Utilities
npm install tiktoken@^1.0.10
npm install marked@^11.2.0
npm install prismjs@^1.29.0
npm install react-markdown@^9.0.0
npm install remark-gfm@^4.0.0
```

### Step 1.2: Setup Environment Variables

Create or update `.env.local`:

```env
# OpenAI (REQUIRED)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Existing from Week 1-4
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

### Step 1.3: Create Supabase Project

**Actions:**
1. Go to https://supabase.com
2. Create new project: "studysync-ai"
3. Wait for project to provision (2-3 minutes)
4. Copy URL and keys to `.env.local`
5. Keep Supabase dashboard open

---

## 🗄️ PHASE 2: Database Setup (Day 1)

### Step 2.1: Update Prisma Schema

Open `prisma/schema.prisma` and add:

```prisma
// AI Conversation Models
model AIConversation {
  id            String      @id @default(cuid())
  title         String      @default("New Conversation")
  userId        String
  user          User        @relation("UserConversations", fields: [userId], references: [id], onDelete: Cascade)
  materialIds   String[]    @default([])
  model         String      @default("gpt-4-turbo-preview")
  temperature   Float       @default(0.7)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  lastMessageAt DateTime?
  messages      AIMessage[]
  
  @@index([userId])
  @@index([lastMessageAt])
  @@map("ai_conversations")
}

model AIMessage {
  id               String         @id @default(cuid())
  conversationId   String
  conversation     AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role             AIMessageRole
  content          String         @db.Text
  sources          Json?
  promptTokens     Int?
  completionTokens Int?
  totalTokens      Int?
  createdAt        DateTime       @default(now())
  
  @@index([conversationId])
  @@index([createdAt])
  @@map("ai_messages")
}

enum AIMessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// Update Material model
model Material {
  // Add these fields to existing Material model
  embeddings        Json?
  isProcessed       Boolean           @default(false)
  processedAt       DateTime?
  chunkCount        Int?
  processingStatus  ProcessingStatus  @default(PENDING)
  processingError   String?
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// Update User model
model User {
  // Add these fields to existing User model
  aiConversations  AIConversation[] @relation("UserConversations")
  aiTokensUsed     Int              @default(0)
  aiTokensLimit    Int              @default(100000)
}
```

### Step 2.2: Run Prisma Migration

```bash
npx prisma migrate dev --name add-ai-assistant
npx prisma generate
```

**Expected output:** Migration successful, client generated

### Step 2.3: Setup Supabase Vector Database

Open Supabase SQL Editor and run:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create material_chunks table
CREATE TABLE material_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id text NOT NULL,
  chunk_text text NOT NULL,
  chunk_index int NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create HNSW index for fast similarity search
CREATE INDEX material_chunks_embedding_idx 
ON material_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create material_id index
CREATE INDEX material_chunks_material_id_idx 
ON material_chunks(material_id);

-- Create similarity search function
CREATE OR REPLACE FUNCTION search_similar_chunks(
  query_embedding vector(1536),
  material_ids text[],
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  material_id text,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.id,
    mc.material_id,
    mc.chunk_text,
    mc.metadata,
    1 - (mc.embedding <=> query_embedding) as similarity
  FROM material_chunks mc
  WHERE 
    mc.material_id = ANY(material_ids)
    AND 1 - (mc.embedding <=> query_embedding) > match_threshold
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Verify:** Check Supabase Table Editor, should see `material_chunks` table

---

## 📝 PHASE 3: Create Utility Files (Day 2)

### Step 3.1: Create Supabase Client

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for frontend (public access)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for backend (admin access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

### Step 3.2: Create OpenAI Client

Create `src/lib/ai/openai.ts`:

```typescript
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Models configuration
export const AI_MODELS = {
  EMBEDDING: 'text-embedding-3-small',
  CHAT: 'gpt-4-turbo-preview',
  CHAT_FALLBACK: 'gpt-3.5-turbo',
} as const;

// Configuration
export const AI_CONFIG = {
  CHUNK_SIZE: 1000,
  CHUNK_OVERLAP: 200,
  TOP_K_CHUNKS: 5,
  SIMILARITY_THRESHOLD: 0.7,
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
} as const;
```

### Step 3.3: Create Text Splitter

Create `src/lib/ai/text-splitter.ts`:

```typescript
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function splitTextIntoChunks(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  const chunks = await splitter.createDocuments([text]);
  
  return chunks.map((chunk, index) => ({
    text: chunk.pageContent,
    index,
    metadata: chunk.metadata,
  }));
}
```

### Step 3.4: Create Embeddings Generator

Create `src/lib/ai/embeddings.ts`:

```typescript
import { openai, AI_MODELS } from './openai';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: AI_MODELS.EMBEDDING,
    input: text,
  });
  
  return response.data[0].embedding;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: AI_MODELS.EMBEDDING,
    input: texts,
  });
  
  return response.data.map(d => d.embedding);
}
```

### Step 3.5: Create Document Processor

Create `src/lib/ai/document-processor.ts`:

```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractTextFromFile(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return extractTextFromDOCX(buffer);
  }
  
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}
```

### Step 3.6: Create Vector Store Operations

Create `src/lib/ai/vector-store.ts`:

```typescript
import { supabaseAdmin } from '../supabase';

export async function storeChunkEmbeddings(
  materialId: string,
  chunks: Array<{
    text: string;
    index: number;
    embedding: number[];
    metadata?: any;
  }>
) {
  const records = chunks.map(chunk => ({
    material_id: materialId,
    chunk_text: chunk.text,
    chunk_index: chunk.index,
    embedding: chunk.embedding,
    metadata: chunk.metadata || {},
  }));
  
  const { data, error } = await supabaseAdmin
    .from('material_chunks')
    .insert(records);
  
  if (error) throw error;
  return data;
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  materialIds: string[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
) {
  const { data, error } = await supabaseAdmin
    .rpc('search_similar_chunks', {
      query_embedding: queryEmbedding,
      material_ids: materialIds,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });
  
  if (error) throw error;
  return data;
}

export async function deleteChunksByMaterialId(materialId: string) {
  const { error } = await supabaseAdmin
    .from('material_chunks')
    .delete()
    .eq('material_id', materialId);
  
  if (error) throw error;
}
```

### Step 3.7: Create Prompt Builder

Create `src/lib/ai/prompt-builder.ts`:

```typescript
interface ContextChunk {
  text: string;
  materialId: string;
  similarity: number;
}

export function buildRAGPrompt(
  userQuestion: string,
  contextChunks: ContextChunk[]
): string {
  const context = contextChunks
    .map((chunk, i) => `[Source ${i + 1}]\n${chunk.text}`)
    .join('\n\n');
  
  return `You are a helpful AI study assistant. Answer the question based ONLY on the provided context from the user's study materials.

CONTEXT:
${context}

QUESTION: ${userQuestion}

INSTRUCTIONS:
- Answer based strictly on the context provided
- If the context doesn't contain enough information, say "I don't have enough information in your materials to answer this question"
- Cite sources by referring to [Source 1], [Source 2], etc.
- Be clear, concise, and educational
- Use examples from the context when possible

ANSWER:`;
}
```

---

## 🔧 PHASE 4: Build Material Processing API (Day 2-3)

### Step 4.1: Create Processing API Route

Create `src/app/api/materials/process/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractTextFromFile } from '@/lib/ai/document-processor';
import { splitTextIntoChunks } from '@/lib/ai/text-splitter';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import { storeChunkEmbeddings } from '@/lib/ai/vector-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const materialId = params.id;
    
    // Get material
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }
    
    if (material.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    if (material.isProcessed) {
      return NextResponse.json({ 
        message: 'Material already processed',
        data: { materialId, chunkCount: material.chunkCount }
      });
    }
    
    // Update status to PROCESSING
    await prisma.material.update({
      where: { id: materialId },
      data: { processingStatus: 'PROCESSING' },
    });
    
    // Step 1: Extract text
    const text = await extractTextFromFile(material.fileUrl, material.mimeType);
    
    // Step 2: Split into chunks
    const chunks = await splitTextIntoChunks(text);
    
    // Step 3: Generate embeddings in batches
    const batchSize = 100;
    const allEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await generateEmbeddingsBatch(batch.map(c => c.text));
      allEmbeddings.push(...embeddings);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Step 4: Store in vector database
    const chunksWithEmbeddings = chunks.map((chunk, i) => ({
      ...chunk,
      embedding: allEmbeddings[i],
    }));
    
    await storeChunkEmbeddings(materialId, chunksWithEmbeddings);
    
    // Step 5: Update material status
    await prisma.material.update({
      where: { id: materialId },
      data: {
        isProcessed: true,
        processedAt: new Date(),
        chunkCount: chunks.length,
        processingStatus: 'COMPLETED',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Material processed successfully',
      data: {
        materialId,
        chunkCount: chunks.length,
      },
    });
    
  } catch (error) {
    console.error('Processing error:', error);
    
    // Update status to FAILED
    await prisma.material.update({
      where: { id: params.id },
      data: {
        processingStatus: 'FAILED',
        processingError: error.message,
      },
    });
    
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    );
  }
}
```

**Test this API:** Use Postman or Thunder Client to POST to `/api/materials/process/[materialId]`

---

## 💬 PHASE 5: Build Chat API (Day 3-4)

### Step 5.1: Create Chat API Route

Create `src/app/api/ai/chat/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { openai, AI_MODELS, AI_CONFIG } from '@/lib/ai/openai';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { searchSimilarChunks } from '@/lib/ai/vector-store';
import { buildRAGPrompt } from '@/lib/ai/prompt-builder';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const { message, conversationId, materialIds } = await request.json();
    
    // Validation
    if (!message || !materialIds || materialIds.length === 0) {
      return new Response('Invalid request', { status: 400 });
    }
    
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId },
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: session.user.id,
          materialIds,
          title: message.slice(0, 50),
        },
      });
    }
    
    // Save user message
    await prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });
    
    // Step 1: Generate query embedding
    const queryEmbedding = await generateEmbedding(message);
    
    // Step 2: Search similar chunks
    const similarChunks = await searchSimilarChunks(
      queryEmbedding,
      materialIds,
      AI_CONFIG.SIMILARITY_THRESHOLD,
      AI_CONFIG.TOP_K_CHUNKS
    );
    
    // Step 3: Build RAG prompt
    const prompt = buildRAGPrompt(message, similarChunks);
    
    // Step 4: Stream response from GPT-4
    const response = await openai.chat.completions.create({
      model: AI_MODELS.CHAT,
      messages: [
        { role: 'system', content: 'You are a helpful study assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      max_tokens: AI_CONFIG.MAX_TOKENS,
      stream: true,
    });
    
    // Convert to stream
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        // Save assistant message
        await prisma.aIMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'ASSISTANT',
            content: completion,
            sources: similarChunks,
          },
        });
        
        // Update conversation
        await prisma.aIConversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });
      },
    });
    
    return new StreamingTextResponse(stream);
    
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

---

## 📱 PHASE 6: Build Frontend UI (Day 5-8)

### Step 6.1: Create Chat Interface Page

Create `src/app/(dashboard)/ai-assistant/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { ChatInterface } from '@/components/ai/chat-interface';
import { ConversationList } from '@/components/ai/conversation-list';
import { MaterialSelector } from '@/components/ai/material-selector';

export default function AIAssistantPage() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: {
      conversationId,
      materialIds: selectedMaterials,
    },
  });
  
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 border-r p-4">
        <ConversationList
          onSelectConversation={setConversationId}
          currentConversationId={conversationId}
        />
      </aside>
      
      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        <ChatInterface
          messages={messages}
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          selectedMaterials={selectedMaterials}
          onSelectMaterials={setSelectedMaterials}
        />
      </main>
    </div>
  );
}
```

### Step 6.2: Create Chat Interface Component

Create `src/components/ai/chat-interface.tsx`:

```typescript
'use client';

import { FormEvent } from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { MaterialSelector } from './material-selector';
import { Button } from '@/components/ui/button';

interface ChatInterfaceProps {
  messages: any[];
  input: string;
  onInputChange: (e: any) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  selectedMaterials: string[];
  onSelectMaterials: (ids: string[]) => void;
}

export function ChatInterface({
  messages,
  input,
  onInputChange,
  onSubmit,
  isLoading,
  selectedMaterials,
  onSelectMaterials,
}: ChatInterfaceProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Study Assistant</h1>
        <MaterialSelector
          selectedIds={selectedMaterials}
          onSelect={onSelectMaterials}
        />
      </header>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      
      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          disabled={selectedMaterials.length === 0}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h2 className="text-2xl font-semibold mb-2">Welcome to AI Assistant</h2>
      <p className="text-muted-foreground mb-4">
        Select materials and start asking questions about your study content
      </p>
    </div>
  );
}
```

### Step 6.3: Create Message Components

Create `src/components/ai/message-list.tsx`:

```typescript
'use client';

import { MessageBubble } from './message-bubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
```

Create `src/components/ai/message-bubble.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      'flex',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted'
      )}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t text-xs opacity-70">
            Sources: {message.sources.length} chunks from your materials
          </div>
        )}
      </div>
    </div>
  );
}
```

Create `src/components/ai/message-input.tsx`:

```typescript
'use client';

import { FormEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (e: any) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
}: MessageInputProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSubmit(e);
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={value}
        onChange={onChange}
        placeholder={
          disabled
            ? 'Select materials first...'
            : 'Ask a question about your study materials...'
        }
        disabled={disabled || isLoading}
        className="min-h-[80px] resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button
        type="submit"
        disabled={!value.trim() || isLoading || disabled}
        size="icon"
        className="h-[80px] w-12"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}
```

### Step 6.4: Create Material Selector

Create `src/components/ai/material-selector.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen } from 'lucide-react';

interface Material {
  id: string;
  title: string;
  type: string;
  isProcessed: boolean;
}

interface MaterialSelectorProps {
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}

export function MaterialSelector({ selectedIds, onSelect }: MaterialSelectorProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    fetchMaterials();
  }, []);
  
  const fetchMaterials = async () => {
    const response = await fetch('/api/materials?isProcessed=true');
    const data = await response.json();
    setMaterials(data.data.materials);
  };
  
  const toggleMaterial = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter(sid => sid !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          Materials ({selectedIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Study Materials</DialogTitle>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center space-x-2 p-3 border rounded hover:bg-muted"
            >
              <Checkbox
                id={material.id}
                checked={selectedIds.includes(material.id)}
                onCheckedChange={() => toggleMaterial(material.id)}
              />
              <label htmlFor={material.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{material.title}</div>
                <div className="text-sm text-muted-foreground">
                  {material.type}
                </div>
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Apply ({selectedIds.length} selected)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 6.5: Create Conversation List

Create `src/components/ai/conversation-list.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

interface Conversation {
  id: string;
  title: string;
  lastMessageAt: string;
}

interface ConversationListProps {
  onSelectConversation: (id: string | null) => void;
  currentConversationId: string | null;
}

export function ConversationList({
  onSelectConversation,
  currentConversationId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  const fetchConversations = async () => {
    const response = await fetch('/api/ai/conversations');
    const data = await response.json();
    setConversations(data.data);
  };
  
  const handleNewConversation = () => {
    onSelectConversation(null);
  };
  
  return (
    <div className="space-y-4">
      <Button
        onClick={handleNewConversation}
        className="w-full"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        New Conversation
      </Button>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Recent Conversations
        </h3>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              'w-full text-left p-3 rounded-lg hover:bg-muted transition',
              currentConversationId === conv.id && 'bg-muted'
            )}
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{conv.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(conv.lastMessageAt)}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 🧪 PHASE 7: Testing (Day 9-10)

### Step 7.1: Test Material Processing

1. Upload a PDF material (Week 4)
2. Call: `POST /api/materials/process/[materialId]`
3. Check Supabase dashboard → `material_chunks` table
4. Verify chunks exist with embeddings
5. Check material status: `isProcessed = true`

### Step 7.2: Test Chat Flow

1. Go to `/ai-assistant`
2. Click "Select Materials"
3. Choose processed materials
4. Type question: "What is process scheduling?"
5. Verify:
   - Message sends
   - Response streams
   - Sources cited
   - Message saves to DB

### Step 7.3: Test Edge Cases

- Try without selecting materials (should be disabled)
- Try with unprocessed materials (should filter out)
- Try very long questions (should handle)
- Try special characters (should escape)
- Try rate limiting (10 messages/minute)

---

## 🎨 PHASE 8: Polish & Optimization (Day 11-12)

### Step 8.1: Add Loading States

- Show skeleton while loading conversations
- Show typing indicator while AI responds
- Show progress during material processing

### Step 8.2: Add Error Handling

- Handle OpenAI API errors gracefully
- Show user-friendly error messages
- Retry failed requests
- Log errors to console

### Step 8.3: Add Token Tracking

Update user's token usage after each chat:

```typescript
// In chat API after completion
await prisma.user.update({
  where: { id: session.user.id },
  data: {
    aiTokensUsed: {
      increment: totalTokens,
    },
  },
});
```

### Step 8.4: Performance Optimizations

- Cache processed materials list
- Debounce search inputs
- Lazy load conversation history
- Optimize vector search queries
- Add indexes on conversation queries

---

## ✅ PHASE 9: Final Verification (Day 13-14)

### Checklist:

**Document Processing:**
- [ ] PDFs process correctly
- [ ] DOCX files process correctly
- [ ] Text chunks preserve meaning
- [ ] Embeddings stored in Supabase
- [ ] Processing status updates

**Chat System:**
- [ ] Messages send and receive
- [ ] Streaming works smoothly
- [ ] Material selector functions
- [ ] Conversations save
- [ ] History loads

**RAG Pipeline:**
- [ ] Query generates embedding
- [ ] Similarity search finds chunks
- [ ] Context builds correctly
- [ ] GPT-4 responds with citations
- [ ] Sources are accurate

**UI/UX:**
- [ ] Responsive on mobile
- [ ] Markdown renders correctly
- [ ] Code blocks highlight
- [ ] Loading states show
- [ ] Errors display clearly

**Security:**
- [ ] Auth protects routes
- [ ] Rate limiting works
- [ ] Token tracking works
- [ ] Users can't access others' materials

---

## 🚀 Deployment Steps

1. **Environment Variables:**
   - Add all to Vercel/hosting platform
   - Test connection to Supabase
   - Verify OpenAI API key

2. **Database:**
   - Run Prisma migrations in production
   - Create Supabase production project
   - Run SQL setup script

3. **Testing:**
   - Test on production URL
   - Process a material
   - Have a conversation
   - Check performance

4. **Monitoring:**
   - Set up error tracking (Sentry)
   - Monitor OpenAI usage
   - Track token consumption
   - Watch for rate limits

---

## 📊 Success Metrics

After completion, verify:

✅ Users can upload and process materials  
✅ Materials chunk and embed correctly  
✅ Chat interface is responsive and smooth  
✅ AI responds based on user's materials  
✅ Sources are cited accurately  
✅ Multiple conversations work  
✅ Token usage tracked  
✅ Rate limits prevent abuse  
✅ Mobile experience is good  
✅ No hallucinations (says "I don't know")

---

## 🆘 Troubleshooting

**Issue: "Module not found: langchain"**
- Solution: `npm install langchain @langchain/openai`

**Issue: "OpenAI API key invalid"**
- Solution: Check `.env.local`, ensure key starts with `sk-`

**Issue: "Supabase RPC function not found"**
- Solution: Re-run the SQL setup script in Supabase

**Issue: "Material processing fails"**
- Solution: Check file URL is accessible, check file type supported

**Issue: "Vector search returns no results"**
- Solution: Verify embeddings stored, check material is processed

**Issue: "Streaming not working"**
- Solution: Ensure using `export const runtime = 'edge'` in API route

---

## 🎯 Final Notes

- Follow steps sequentially
- Test after each phase
- Don't skip verification steps
- Keep Supabase dashboard open for monitoring
- Check browser console for errors
- Use Postman for API testing

**Estimated Total Time:** 10-14 days  
**Complexity:** High  
**Result:** Production-ready AI Assistant with RAG

---

**Good luck! Build something amazing! 🚀**
