import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

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
