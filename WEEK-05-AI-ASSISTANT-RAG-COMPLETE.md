# Week 5: AI Assistant with RAG (Retrieval Augmented Generation)

## 📋 Overview

**Duration:** 10-14 days  
**Prerequisites:** Week 1-4 (Foundation, Auth, Dashboard, Materials) Complete  
**Goal:** Build intelligent AI assistant using RAG pipeline for context-aware responses  
**Core Technology:** OpenAI GPT-4 + Vector Database + LangChain

---

## 🎯 What is RAG and Why?

### Problem with Normal AI Chat:
❌ AI doesn't know about your specific study materials  
❌ Gives generic answers not related to your notes  
❌ Can't reference your uploaded PDFs/documents  
❌ Hallucinations (makes up information)

### Solution: RAG (Retrieval Augmented Generation)
✅ AI reads your uploaded materials  
✅ Gives answers based on YOUR content  
✅ Cites specific parts of your documents  
✅ Reduces hallucinations significantly

### How RAG Works:
```
User uploads PDF → Extract text → Break into chunks → 
Generate embeddings → Store in vector DB →

User asks question → Find relevant chunks → 
Send chunks + question to GPT-4 → Get contextual answer
```

---

## 🧠 Core Features We're Building

### 1. **Document Processing Pipeline**
- Extract text from PDFs, DOCX, TXT
- Intelligent chunking (overlap for context)
- Generate embeddings using OpenAI
- Store in vector database (Supabase pgvector)

### 2. **AI Chat Interface**
- Real-time streaming responses
- Material context selector
- Conversation history
- Source citations
- Code syntax highlighting

### 3. **Conversation Management**
- Multiple conversations
- Save/load conversations
- Rename conversations
- Delete conversations
- Export chat history

### 4. **Smart Context Retrieval**
- Similarity search in vector DB
- Top-K relevant chunks
- Re-ranking for quality
- Context window optimization

---

## 🗄️ Database Schema

### AI Conversation Models

```prisma
model AIConversation {
  id          String      @id @default(cuid())
  title       String      @default("New Conversation")
  
  // User ownership
  userId      String
  user        User        @relation("UserConversations", fields: [userId], references: [id], onDelete: Cascade)
  
  // Material context (which materials are being used)
  materialIds String[]    @default([])
  
  // Settings
  model       String      @default("gpt-4-turbo-preview")
  temperature Float       @default(0.7)
  
  // Metadata
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  lastMessageAt DateTime?
  
  // Relations
  messages    AIMessage[]
  
  @@index([userId])
  @@index([lastMessageAt])
  @@map("ai_conversations")
}

model AIMessage {
  id             String         @id @default(cuid())
  conversationId String
  conversation   AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  // Message content
  role           AIMessageRole
  content        String         @db.Text
  
  // Source citations (which chunks were used)
  sources        Json?          // Array of { materialId, chunkId, text, score }
  
  // Token usage tracking
  promptTokens   Int?
  completionTokens Int?
  totalTokens    Int?
  
  // Metadata
  createdAt      DateTime       @default(now())
  
  @@index([conversationId])
  @@index([createdAt])
  @@map("ai_messages")
}

enum AIMessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// Update Material model to support embeddings
model Material {
  // ... existing fields from Week 4
  
  // NEW: Vector embeddings and processing
  embeddings     Json?          // Will store vector data
  isProcessed    Boolean        @default(false)
  processedAt    DateTime?
  chunkCount     Int?           // Number of chunks created
  
  // Processing status
  processingStatus ProcessingStatus @default(PENDING)
  processingError  String?
  
  // ... rest of fields
}

enum ProcessingStatus {
  PENDING       // Not yet processed
  PROCESSING    // Currently processing
  COMPLETED     // Successfully processed
  FAILED        // Processing failed
}
```

### Update User Model

```prisma
model User {
  // ... existing fields
  
  // NEW: AI conversations
  aiConversations AIConversation[] @relation("UserConversations")
  
  // AI usage tracking (for limits)
  aiTokensUsed    Int              @default(0)
  aiTokensLimit   Int              @default(100000)  // 100K tokens per month
  
  // ... rest of fields
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add-ai-assistant
npx prisma generate
```

---

## 🛠️ Technology Stack & Libraries

### 1. **OpenAI SDK** (LLM Provider)
```bash
npm install openai
```

**Why OpenAI:**
- ✅ Best-in-class GPT-4 model
- ✅ Streaming support
- ✅ Function calling capability
- ✅ Embeddings API (text-embedding-3-small)
- ✅ Excellent documentation

**Alternatives:**
- Anthropic Claude (via `@anthropic-ai/sdk`)
- Google Gemini (via `@google/generative-ai`)
- Local models (via Ollama)

---

### 2. **LangChain** (RAG Framework)
```bash
npm install langchain
npm install @langchain/openai
npm install @langchain/community
```

**Why LangChain:**
- ✅ Built specifically for RAG
- ✅ Document loaders (PDF, DOCX, TXT)
- ✅ Text splitters (intelligent chunking)
- ✅ Vector store integrations
- ✅ Chain abstraction
- ✅ Best practices built-in

**What We'll Use:**
- `RecursiveCharacterTextSplitter` - Smart chunking
- `OpenAIEmbeddings` - Generate embeddings
- `Document` - Document structure
- `VectorStore` - Vector operations

---

### 3. **Supabase** (Vector Database)
```bash
npm install @supabase/supabase-js
```

**Why Supabase:**
- ✅ PostgreSQL + pgvector extension
- ✅ Free tier: 500MB database
- ✅ Built-in vector similarity search
- ✅ Easy Next.js integration
- ✅ Real-time capabilities

**Setup Steps:**
1. Create Supabase project
2. Enable pgvector extension
3. Create embeddings table
4. Create similarity search function

**Alternative Vector Databases:**
- Pinecone (dedicated vector DB)
- Weaviate (open-source)
- Qdrant (fast, Rust-based)
- Chroma (embedded DB)

---

### 4. **PDF Processing**
```bash
npm install pdf-parse
npm install pdfjs-dist
```

**Why These:**
- ✅ Extract text from PDFs
- ✅ Preserve formatting
- ✅ Handle scanned PDFs (with OCR)

---

### 5. **Document Processing**
```bash
npm install mammoth          # DOCX to text
npm install office-text-extractor  # Multiple formats
```

---

### 6. **AI SDK (Vercel)** - For Streaming
```bash
npm install ai
```

**Why Vercel AI SDK:**
- ✅ Easy streaming responses
- ✅ React hooks (useChat)
- ✅ Built-in error handling
- ✅ Token usage tracking

---

## 📁 Complete File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── ai-assistant/
│   │       ├── page.tsx                    # Main AI chat interface
│   │       ├── loading.tsx
│   │       │
│   │       ├── [conversationId]/
│   │       │   └── page.tsx                # Specific conversation
│   │       │
│   │       └── new/
│   │           └── page.tsx                # Start new conversation
│   │
│   └── api/
│       ├── ai/
│       │   ├── chat/
│       │   │   └── route.ts                # POST - Send message, stream response
│       │   │
│       │   ├── conversations/
│       │   │   ├── route.ts                # GET - List, POST - Create
│       │   │   └── [id]/
│       │   │       ├── route.ts            # GET, PATCH, DELETE conversation
│       │   │       └── messages/
│       │   │           └── route.ts        # GET - Conversation messages
│       │   │
│       │   └── embeddings/
│       │       └── generate/
│       │           └── route.ts            # POST - Process material
│       │
│       └── materials/
│           └── process/
│               └── [id]/
│                   └── route.ts            # POST - Trigger processing (from Week 4)
│
├── components/
│   └── ai/
│       ├── chat-interface.tsx              # Main chat UI
│       ├── message-list.tsx                # Message display
│       ├── message-bubble.tsx              # Single message
│       ├── message-input.tsx               # Input with actions
│       ├── material-selector.tsx           # Select materials for context
│       ├── conversation-list.tsx           # Sidebar with conversations
│       ├── conversation-item.tsx           # Single conversation
│       ├── source-citation.tsx             # Show source references
│       ├── streaming-message.tsx           # Loading animation
│       ├── code-block.tsx                  # Syntax highlighted code
│       ├── markdown-renderer.tsx           # Render markdown
│       ├── typing-indicator.tsx            # "AI is typing..."
│       ├── model-selector.tsx              # Choose GPT model
│       ├── empty-state.tsx                 # No conversations yet
│       └── settings-panel.tsx              # Temperature, tokens, etc
│
└── lib/
    ├── ai/
    │   ├── openai.ts                       # OpenAI client
    │   ├── embeddings.ts                   # Generate embeddings
    │   ├── vector-store.ts                 # Supabase vector operations
    │   ├── document-processor.ts           # Process materials
    │   ├── text-splitter.ts                # Chunk documents
    │   ├── similarity-search.ts            # Find relevant chunks
    │   ├── prompt-builder.ts               # Build RAG prompts
    │   └── streaming.ts                    # Handle streaming
    │
    └── supabase.ts                         # Supabase client
```

---

## 🔄 Complete RAG Pipeline Flow

### Phase 1: Document Processing (Background Job)

```
Material Uploaded (Week 4)
  ↓
Trigger Processing
  ↓
┌─────────────────────────────────────────┐
│  Step 1: Extract Text                   │
│  - PDF → pdf-parse                      │
│  - DOCX → mammoth                       │
│  - TXT → direct read                    │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 2: Clean & Prepare Text          │
│  - Remove extra whitespace              │
│  - Fix encoding issues                  │
│  - Preserve structure (headings, lists) │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 3: Intelligent Chunking           │
│  Library: RecursiveCharacterTextSplitter│
│  - Chunk size: 1000 tokens              │
│  - Overlap: 200 tokens (for context)    │
│  - Split on: paragraphs, sentences      │
│  - Preserve semantic meaning            │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 4: Generate Embeddings            │
│  Model: text-embedding-3-small          │
│  - For each chunk                       │
│  - 1536 dimensions                      │
│  - Batch processing (100 chunks/batch)  │
│  - Cost optimization                    │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 5: Store in Vector Database       │
│  Database: Supabase (pgvector)          │
│  Table: material_chunks                 │
│  Columns:                               │
│  - id, material_id, chunk_text          │
│  - embedding (vector(1536))             │
│  - metadata (page, position)            │
│  - created_at                           │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 6: Update Material Status         │
│  - isProcessed = true                   │
│  - chunkCount = X                       │
│  - processingStatus = COMPLETED         │
└─────────────────────────────────────────┘
```

---

### Phase 2: Query & Response (Real-time)

```
User Asks Question
  ↓
"Explain process scheduling in OS"
  ↓
┌─────────────────────────────────────────┐
│  Step 1: Generate Query Embedding       │
│  - Same model: text-embedding-3-small   │
│  - Convert question to vector           │
│  - 1536 dimensions                      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 2: Vector Similarity Search       │
│  Method: Cosine similarity              │
│  Query: SELECT * FROM material_chunks   │
│         WHERE material_id IN (...)      │
│         ORDER BY embedding <=> $query   │
│         LIMIT 5                         │
│  Returns: Top 5 most relevant chunks    │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 3: Re-rank Results (Optional)     │
│  - Score by relevance                   │
│  - Remove duplicate information         │
│  - Prioritize by similarity score       │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 4: Build Context Prompt           │
│  Template:                              │
│  "You are a study assistant.            │
│   Use the following context to answer:  │
│                                         │
│   CONTEXT:                              │
│   [Chunk 1 text]                        │
│   [Chunk 2 text]                        │
│   [Chunk 3 text]                        │
│                                         │
│   QUESTION: {user_question}             │
│                                         │
│   INSTRUCTIONS:                         │
│   - Answer based on context             │
│   - Cite sources                        │
│   - Say 'I don't know' if not in context"│
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 5: Send to GPT-4                  │
│  Model: gpt-4-turbo-preview             │
│  Temperature: 0.7 (balanced)            │
│  Max tokens: 1000                       │
│  Stream: true (real-time response)      │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│  Step 6: Stream Response to User        │
│  - Token by token display               │
│  - Show "thinking" indicator            │
│  - Display source citations             │
│  - Track token usage                    │
└─────────────────────────────────────────┘
```

---

## 🧩 Optimized Algorithms

### 1. **Text Chunking Algorithm**

**Problem:** How to split documents without breaking context?

**Solution: Recursive Character Text Splitter**

**How it Works:**
```
1. Try to split by paragraphs first
2. If chunk too large, split by sentences
3. If still too large, split by words
4. If still too large, split by characters
5. Add overlap between chunks for context
```

**Configuration:**
```typescript
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,        // ~750 words
  chunkOverlap: 200,      // 150 word overlap
  separators: [
    "\n\n",               // Paragraphs
    "\n",                 // Lines
    ". ",                 // Sentences
    " ",                  // Words
    ""                    // Characters
  ]
});
```

**Why This Works:**
✅ Preserves semantic meaning  
✅ Overlap maintains context  
✅ Recursive ensures no chunk too large  
✅ Respects natural boundaries

---

### 2. **Similarity Search Algorithm**

**Problem:** Find most relevant chunks from thousands efficiently

**Solution: Cosine Similarity with pgvector**

**How it Works:**
```
Given:
- Query embedding: Q (1536 dimensions)
- All chunk embeddings: C1, C2, C3... (each 1536 dimensions)

Calculate cosine similarity:
similarity(Q, Ci) = (Q · Ci) / (||Q|| × ||Ci||)

Result: Score between -1 and 1
- 1 = identical
- 0 = orthogonal (unrelated)
- -1 = opposite
```

**Optimized SQL Query:**
```sql
SELECT 
  id,
  material_id,
  chunk_text,
  metadata,
  1 - (embedding <=> $query_embedding) as similarity
FROM material_chunks
WHERE material_id = ANY($material_ids)
  AND 1 - (embedding <=> $query_embedding) > 0.7  -- Threshold
ORDER BY embedding <=> $query_embedding
LIMIT 5;
```

**Optimizations:**
✅ pgvector uses HNSW (Hierarchical Navigable Small World) index  
✅ Approximate nearest neighbor (100x faster than exact)  
✅ Filters by material_id first (reduces search space)  
✅ Similarity threshold (removes irrelevant results)

---

### 3. **Context Window Optimization**

**Problem:** GPT-4 has token limit (8K-128K), need to fit context + question

**Solution: Smart Context Packing**

**Algorithm:**
```
Available tokens: 8000 (for gpt-4-turbo-preview)
Reserved for response: 1000 tokens
Reserved for prompt template: 500 tokens
Available for context: 6500 tokens

For each chunk (sorted by similarity):
  1. Estimate tokens (text length / 4)
  2. If (current_tokens + chunk_tokens) < 6500:
       Add chunk to context
  3. Else:
       Stop adding chunks
  
Result: Maximum relevant context within limits
```

**Optimization:**
✅ Prioritize by similarity score  
✅ Stop when reaching limit  
✅ Never exceed token limit  
✅ Maximize information density

---

### 4. **Batch Embedding Generation**

**Problem:** Processing 1000 chunks one-by-one is slow and expensive

**Solution: Batch Processing**

**Algorithm:**
```
chunks = [chunk1, chunk2, ..., chunk1000]
BATCH_SIZE = 100

for batch in chunks.batch(BATCH_SIZE):
  embeddings = openai.embeddings.create(
    input=[chunk.text for chunk in batch],
    model="text-embedding-3-small"
  )
  
  save_to_database(batch, embeddings)
  
  wait(0.1)  // Rate limiting
```

**Benefits:**
✅ 100x faster than sequential  
✅ Cost stays the same  
✅ Rate limit friendly  
✅ Progress tracking possible

---

## 🎨 UI/UX Design

### Chat Interface Layout

```
┌────────────────────────────────────────────────────────────┐
│  Sidebar (256px)              │  Chat Area                 │
├───────────────────────────────┼────────────────────────────┤
│                               │                            │
│  [+ New Conversation]         │  Chat Header               │
│                               │  "Conversation Title"      │
│  🔍 Search...                 │  [Materials: 2] [⚙️]       │
│                               │                            │
│  Recent Conversations:        │  ────────────────────────  │
│  ○ OS Notes Discussion        │                            │
│    "What is process..."       │  Messages Area             │
│    2 hours ago                │  (Scrollable)              │
│                               │                            │
│  ○ Algorithm Help             │  User: "What is..."        │
│    "Explain quicksort..."     │                            │
│    Yesterday                  │  AI: "Based on your..."    │
│                               │  [Source: OS Notes p.23]   │
│  ○ Data Structures            │                            │
│    "How do linked..."         │  User: "Tell me more"      │
│    3 days ago                 │                            │
│                               │  AI: [Typing...]           │
│  [Load More]                  │                            │
│                               │  ────────────────────────  │
│                               │                            │
│                               │  Input Area                │
│                               │  ┌──────────────────────┐ │
│                               │  │ Type message...      │ │
│                               │  │                      │ │
│                               │  └──────────────────────┘ │
│                               │  [📎] [🎤] [Send]         │
└───────────────────────────────┴────────────────────────────┘

Mobile Layout:
┌────────────────────────┐
│  Header                │
│  "OS Notes Discussion" │
│  [☰] [Materials] [⚙️]  │
├────────────────────────┤
│  Messages              │
│  (Full screen)         │
│                        │
│  User: "..."           │
│  AI: "..."             │
│                        │
├────────────────────────┤
│  Input                 │
│  [Type...] [Send]      │
└────────────────────────┘
```

---

### Message Bubble Design

**User Message:**
```
┌─────────────────────────────────┐
│  What is process scheduling?    │  ← Right aligned
└─────────────────────────────────┘  ← Blue background
  11:23 AM
```

**AI Message:**
```
┌─────────────────────────────────────────────┐
│  Based on your Operating Systems notes,     │  ← Left aligned
│  process scheduling is...                   │  ← Gray background
│                                             │
│  [Source: OS Notes, Page 23]                │  ← Citation
└─────────────────────────────────────────────┘
  11:23 AM  •  52 tokens
```

**Streaming Message:**
```
┌─────────────────────────────────────────────┐
│  Process scheduling refers to...            │
│  ▊                                          │  ← Blinking cursor
└─────────────────────────────────────────────┘
  Generating response...
```

---

### Material Selector Modal

```
┌──────────────────────────────────────────┐
│  Select Materials for Context            │
├──────────────────────────────────────────┤
│  🔍 Search materials...                  │
│                                          │
│  My Materials (24):                      │
│  ☑ Operating Systems Notes (2.4 MB)     │
│  ☐ Data Structures PDF (1.8 MB)         │
│  ☑ Algorithm Analysis (3.2 MB)          │
│  ☐ Database Systems (2.1 MB)            │
│                                          │
│  Selected: 2 materials (5.6 MB)         │
│  Estimated chunks: ~450                  │
│                                          │
│  [Cancel] [Apply Selection]             │
└──────────────────────────────────────────┘
```

---

## 🔌 API Implementation Details

### 1. Chat API (with Streaming)

**Endpoint:** `POST /api/ai/chat`  
**Purpose:** Send message and get AI response (streamed)

**Request Body:**
```json
{
  "conversationId": "conv_123",  // null for new conversation
  "message": "What is process scheduling?",
  "materialIds": ["mat_456", "mat_789"],  // Materials to use as context
  "model": "gpt-4-turbo-preview",
  "temperature": 0.7
}
```

**Process Flow:**
```typescript
1. Validate input
2. Get or create conversation
3. Save user message to database
4. Get material context:
   a. Generate query embedding
   b. Search vector database
   c. Get top 5 relevant chunks
5. Build RAG prompt with context
6. Stream response from OpenAI
7. Save assistant message
8. Track token usage
9. Return stream to client
```

**Response:** Server-Sent Events (SSE)
```
data: {"type":"start"}

data: {"type":"token","content":"Based"}
data: {"type":"token","content":" on"}
data: {"type":"token","content":" your"}
data: {"type":"token","content":" notes"}
...

data: {"type":"sources","sources":[{"materialId":"mat_456","text":"...","page":23}]}

data: {"type":"end","messageId":"msg_123","tokens":{"prompt":450,"completion":120,"total":570}}
```

---

### 2. Process Material API

**Endpoint:** `POST /api/materials/process/[id]`  
**Purpose:** Extract text, chunk, and generate embeddings

**Process:**
```typescript
1. Get material from database
2. Check if already processed
3. Download file from URL (Week 4 storage)
4. Extract text based on type:
   - PDF: pdf-parse
   - DOCX: mammoth
   - TXT: direct read
5. Clean and prepare text
6. Split into chunks (RecursiveCharacterTextSplitter)
7. Generate embeddings (batch of 100)
8. Store in Supabase vector DB
9. Update material status
10. Return success
```

**Response:**
```json
{
  "success": true,
  "data": {
    "materialId": "mat_123",
    "chunkCount": 45,
    "processingTime": 12.5,
    "status": "COMPLETED"
  }
}
```

---

### 3. Similarity Search Function

**Database Function:** `search_similar_chunks`

**SQL:**
```sql
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

**Usage:**
```typescript
const { data, error } = await supabase
  .rpc('search_similar_chunks', {
    query_embedding: queryEmbedding,
    material_ids: materialIds,
    match_threshold: 0.7,
    match_count: 5
  });
```

---

## 📊 Supabase Vector Database Setup

### Table Structure

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chunks table
CREATE TABLE material_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id text NOT NULL,
  chunk_text text NOT NULL,
  chunk_index int NOT NULL,
  
  -- Vector embedding (1536 dimensions for text-embedding-3-small)
  embedding vector(1536) NOT NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  
  -- Indexes
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Create vector similarity index (HNSW for speed)
CREATE INDEX ON material_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create material_id index
CREATE INDEX idx_material_chunks_material_id ON material_chunks(material_id);
```

**Index Explanation:**
- `hnsw`: Hierarchical Navigable Small World graph
- `vector_cosine_ops`: Use cosine similarity
- `m = 16`: Number of connections per node (balanced)
- `ef_construction = 64`: Search quality during build (good quality)

---

## 💰 Cost Optimization Strategies

### 1. Embedding Generation Cost

**OpenAI Pricing:**
- text-embedding-3-small: $0.02 per 1M tokens
- Average chunk: 250 tokens
- 1000 chunks = 250K tokens = $0.005

**Optimization:**
✅ Use smaller model (text-embedding-3-small vs ada-002)  
✅ Batch processing (reduce API calls)  
✅ Cache embeddings (don't regenerate)  
✅ Process only once per material

---

### 2. GPT-4 Response Cost

**OpenAI Pricing:**
- GPT-4 Turbo: $10 per 1M input tokens, $30 per 1M output tokens
- Average query: 500 input + 200 output tokens = $0.011

**Optimization:**
✅ Use GPT-4 Turbo (cheaper than GPT-4)  
✅ Limit context size (only top 5 chunks)  
✅ Set max_tokens limit (control output length)  
✅ Cache common questions (Week 10)

---

### 3. Token Usage Tracking

**Track per User:**
```typescript
// After each AI call
await prisma.user.update({
  where: { id: userId },
  data: {
    aiTokensUsed: {
      increment: totalTokens
    }
  }
});

// Check before allowing request
if (user.aiTokensUsed >= user.aiTokensLimit) {
  throw new Error('Monthly token limit reached');
}
```

---

## 🔒 Security & Rate Limiting

### 1. API Rate Limiting

```typescript
// Per user limits
const LIMITS = {
  MESSAGES_PER_MINUTE: 10,
  MESSAGES_PER_HOUR: 100,
  TOKENS_PER_MONTH: 100000
};

// Check before processing
const recentMessages = await redis.get(`messages:${userId}:minute`);
if (recentMessages >= LIMITS.MESSAGES_PER_MINUTE) {
  throw new Error('Rate limit exceeded. Please wait.');
}
```

---

### 2. Input Validation

```typescript
// Validate message
const messageSchema = z.object({
  message: z.string().min(1).max(2000),  // Limit message length
  materialIds: z.array(z.string()).max(10),  // Max 10 materials
  model: z.enum(['gpt-4-turbo-preview', 'gpt-4']),
  temperature: z.number().min(0).max(1)
});
```

---

### 3. Content Filtering

```typescript
// Check for inappropriate content
const moderationResult = await openai.moderations.create({
  input: userMessage
});

if (moderationResult.results[0].flagged) {
  throw new Error('Message contains inappropriate content');
}
```

---

## ✅ Testing Checklist

### Document Processing:
- [ ] PDF text extraction works
- [ ] DOCX text extraction works
- [ ] Text cleaning works
- [ ] Chunking preserves context
- [ ] Embeddings generate correctly
- [ ] Vector DB stores embeddings
- [ ] Processing handles errors

### Chat Interface:
- [ ] Message send works
- [ ] Streaming displays correctly
- [ ] Material selector works
- [ ] New conversation creates
- [ ] Conversation history loads
- [ ] Messages save to DB
- [ ] Token usage tracked

### RAG Pipeline:
- [ ] Query embedding generates
- [ ] Similarity search returns results
- [ ] Top-K chunks retrieved
- [ ] Context fits in token limit
- [ ] GPT-4 responds correctly
- [ ] Sources cited accurately
- [ ] Hallucinations minimized

### UI/UX:
- [ ] Responsive on mobile
- [ ] Markdown renders correctly
- [ ] Code blocks highlight
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Conversation list scrolls
- [ ] Input textarea expands

---

## 📦 Required NPM Packages

```json
{
  "dependencies": {
    // Core AI
    "openai": "^4.28.0",
    "ai": "^3.0.0",                    // Vercel AI SDK (streaming)
    
    // LangChain
    "langchain": "^0.1.25",
    "@langchain/openai": "^0.0.19",
    "@langchain/community": "^0.0.28",
    
    // Vector DB
    "@supabase/supabase-js": "^2.39.0",
    
    // Document Processing
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0",
    "pdfjs-dist": "^4.0.379",
    
    // Utilities
    "tiktoken": "^1.0.10",             // Token counting
    "marked": "^11.2.0",               // Markdown parsing
    "prismjs": "^1.29.0",              // Code highlighting
    
    // Already installed from Week 1-4
    "zod": "^3.22.0",
    "react-markdown": "^9.0.0"
  }
}
```

---

## 🚀 Implementation Timeline

### Phase 1 (Days 1-3): Setup & Document Processing
1. Install dependencies
2. Setup Supabase + pgvector
3. Create vector tables
4. Implement text extraction
5. Implement chunking
6. Test embedding generation

### Phase 2 (Days 4-6): Vector Store
1. Create embedding storage
2. Implement similarity search
3. Test vector operations
4. Create search function
5. Optimize queries

### Phase 3 (Days 7-10): Chat Interface
1. Build chat UI
2. Create conversation system
3. Implement message display
4. Add material selector
5. Handle streaming responses
6. Test end-to-end flow

### Phase 4 (Days 11-12): RAG Integration
1. Connect processing to chat
2. Build RAG prompt templates
3. Implement context retrieval
4. Add source citations
5. Optimize performance

### Phase 5 (Days 13-14): Polish & Testing
1. Add loading states
2. Error handling
3. Token tracking
4. Rate limiting
5. UI/UX polish
6. Performance testing

---

## 🎯 Success Criteria

✅ Materials process automatically after upload  
✅ Text extracted from PDFs/DOCX correctly  
✅ Chunks maintain semantic meaning  
✅ Embeddings stored in vector DB  
✅ Chat interface is responsive  
✅ Streaming responses work smoothly  
✅ AI answers based on user's materials  
✅ Sources are cited accurately  
✅ Multiple conversations supported  
✅ Token usage tracked per user  
✅ Rate limiting prevents abuse  
✅ Mobile experience is good  
✅ No hallucinations (answers "I don't know")

---

## 📝 Integration Points

### With Week 4 (Materials):
✅ Trigger processing after material upload  
✅ Show "Processing..." status  
✅ Material selector uses Week 4 materials  
✅ Only use materials user has access to

### With Week 3 (Dashboard):
✅ Add AI chat to quick actions  
✅ Show AI usage in stats  
✅ Recent AI conversations in activity

### Preparation for Week 6 (Chat):
✅ Message storage pattern established  
✅ Streaming infrastructure ready  
✅ Real-time updates prepared

---

## 💡 Best Practices

### RAG Quality:
✅ Chunk size: 1000 tokens (optimal)  
✅ Overlap: 200 tokens (context preservation)  
✅ Top-K: 5 chunks (balance quality & cost)  
✅ Similarity threshold: 0.7 (filter noise)  
✅ Re-rank results (quality over quantity)

### Prompt Engineering:
✅ Clear system instructions  
✅ Explicit context boundaries  
✅ Ask for citations  
✅ Handle "I don't know"  
✅ Temperature: 0.7 (balanced)

### Performance:
✅ Batch embedding generation  
✅ Use HNSW index (10-100x faster)  
✅ Cache embeddings  
✅ Stream responses  
✅ Lazy load conversations

---

**Time Estimate:** 10-14 days  
**Difficulty:** High  
**Technologies:** OpenAI GPT-4, LangChain, Supabase pgvector  
**Next Week:** Week 6 - Real-time Chat System

---

Built with ❤️ for StudySync AI
