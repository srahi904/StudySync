interface ContextChunk {
  chunk_text: string;
  material_id: string;
  similarity: number;
}

export function buildRAGPrompt(
  userQuestion: string,
  contextChunks: ContextChunk[]
): string {
  const context = contextChunks
    .map((chunk, i) => `[Source ${i + 1}]\n${chunk.chunk_text}`)
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
