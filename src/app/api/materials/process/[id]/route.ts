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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In Next.js App Router 15+, params is a promise
    const { id: materialId } = await params;
    
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
    const allEmbeddings: number[][] = [];
    
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
    
  } catch (error: any) {
    console.error('Processing error:', error);
    
    // In Next.js App Router 15+, params is a promise
    const { id: failedMaterialId } = await params;
    
    // Update status to FAILED
    await prisma.material.update({
      where: { id: failedMaterialId },
      data: {
        processingStatus: 'FAILED',
        processingError: error.message || 'Unknown error',
      },
    });
    
    return NextResponse.json(
      { error: 'Processing failed', details: error.message },
      { status: 500 }
    );
  }
}
