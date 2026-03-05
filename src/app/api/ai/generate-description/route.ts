import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateText } from 'ai';
import { googleAI, AI_MODELS } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, subject, existingDescription } = await req.json();

    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'A valid title is required to generate a description' },
        { status: 400 }
      );
    }

    let prompt = `You are an AI assistant for StudySync, an educational platform. Your task is to generate a concise, professional, and appealing description for a study material based on its title and subject.

Title: "${title}"
Subject: ${subject || 'Not specified'}
`;

    if (existingDescription && existingDescription.trim().length > 0) {
      prompt += `\nExisting Description: "${existingDescription}"\nPlease improve this description, make it more professional, and highlight key concepts the material likely covers based on the title.`;
    } else {
      prompt += `\nGenerate a description of about 2-4 sentences explaining what topics this material likely covers and who it would be useful for. Use an encouraging, academic tone. Do NOT include phrases like "Here is a description" - just output the description itself.`;
    }

    const { text } = await generateText({
      model: googleAI(AI_MODELS.CHAT_PRIMARY),
      prompt: prompt,
    });

    return NextResponse.json({
      success: true,
      description: text.trim(),
    });

  } catch (error) {
    console.error('[AI_GENERATE_DESCRIPTION_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
