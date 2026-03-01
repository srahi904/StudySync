import { embed, embedMany } from 'ai';
import { googleAI, AI_MODELS } from './gemini';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: googleAI.embedding(AI_MODELS.EMBEDDING),
    value: text,
  });
  
  return embedding;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: googleAI.embedding(AI_MODELS.EMBEDDING),
    values: texts,
  });
  
  return embeddings;
}
