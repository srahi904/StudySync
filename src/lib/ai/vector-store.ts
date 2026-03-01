import { prisma } from '../prisma';
import crypto from 'crypto';

export async function storeChunkEmbeddings(
  materialId: string,
  chunks: Array<{
    text: string;
    index: number;
    embedding: number[];
    metadata?: any;
  }>
) {
  for (const chunk of chunks) {
    const embeddingString = `[${chunk.embedding.join(',')}]`;
    const id = crypto.randomUUID();
    
    await prisma.$executeRaw`
      INSERT INTO "material_chunks" ("id", "materialId", "chunk_text", "chunk_index", "embedding", "metadata", "created_at")
      VALUES (
        ${id},
        ${materialId},
        ${chunk.text},
        ${chunk.index},
        ${embeddingString}::vector,
        ${chunk.metadata ? JSON.stringify(chunk.metadata) : '{}'}::jsonb,
        NOW()
      )
    `;
  }
}

export async function searchSimilarChunks(
  queryEmbedding: number[],
  materialIds: string[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
) {
  const embeddingString = `[${queryEmbedding.join(',')}]`;
  
  const data = await prisma.$queryRaw`
    SELECT 
      "id",
      "materialId" as "material_id",
      "chunk_text",
      "metadata",
      1 - ("embedding" <=> ${embeddingString}::vector) as similarity
    FROM "material_chunks"
    WHERE 
      "materialId" = ANY(${materialIds})
      AND 1 - ("embedding" <=> ${embeddingString}::vector) > ${matchThreshold}
    ORDER BY "embedding" <=> ${embeddingString}::vector
    LIMIT ${matchCount};
  `;
  
  return data;
}

export async function deleteChunksByMaterialId(materialId: string) {
  await prisma.materialChunk.deleteMany({
    where: { materialId }
  });
}
