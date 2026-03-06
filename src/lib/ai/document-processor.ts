// @ts-ignore
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { generateText } from 'ai';
import { googleAI, AI_MODELS } from './gemini';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const base64Image = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const { text } = await generateText({
    model: googleAI(AI_MODELS.CHAT_FALLBACK),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image: new URL(dataUrl),
          },
          {
            type: 'text',
            text: 'Extract ALL visible text from this image. If the image contains diagrams, charts, or illustrations, describe them in detail. Return the extracted text and descriptions as plain text.',
          },
        ],
      },
    ],
  });

  return text || '[Image content could not be extracted]';
}

export async function extractTextFromFile(
  fileUrl: string,
  mimeType: string
): Promise<string> {
  const response = await fetch(fileUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download file from URL: ${response.status} ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  
  if (buffer.length === 0) {
    throw new Error('Downloaded file buffer is empty');
  }
  
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer);
  }
  
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return extractTextFromDOCX(buffer);
  }
  
  if (mimeType === 'text/plain' || mimeType === 'text/markdown' || mimeType === 'text/csv' || mimeType === 'text/html' || mimeType === 'application/json') {
    return buffer.toString('utf-8');
  }

  if (IMAGE_MIME_TYPES.includes(mimeType)) {
    return extractTextFromImage(buffer, mimeType);
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}
