// @ts-ignore
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
  
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8');
  }
  
  throw new Error(`Unsupported file type: ${mimeType}`);
}
