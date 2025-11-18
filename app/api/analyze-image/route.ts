import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { normalizeUrl } from '@/lib/url-utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, availableTags } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(imageUrl);

    if (normalizedUrl !== imageUrl) {
      console.log('  ⚠️ Added missing https:// prefix');
      console.log('  Original URL:', imageUrl.substring(0, 60) + '...');
      console.log('  Normalized URL:', normalizedUrl.substring(0, 60) + '...');
    }

    const tagsByCategory: Record<string, string[]> = {};
    availableTags.forEach((tag: any) => {
      if (!tagsByCategory[tag.filter_name]) {
        tagsByCategory[tag.filter_name] = [];
      }
      tagsByCategory[tag.filter_name].push(tag.name);
    });

    const tagCategoriesText = Object.entries(tagsByCategory)
      .map(([category, tags]) =>
        `${category}:\n${tags.map(t => `- ${t}`).join('\n')}`
      )
      .join('\n\n');

    const prompt = `You are analyzing a property/filming location image. Your task is to identify which tags from the provided list accurately describe what is visible in this image.

Available tag categories and options:

${tagCategoriesText}

CRITICAL INSTRUCTIONS:
1. Only select tags that are CLEARLY VISIBLE or DIRECTLY APPLICABLE in this specific image
2. Be conservative and accurate - only tag what you're confident about
3. For architectural styles, only tag if the style is clearly identifiable
4. For features like "Parking" or "Pool", only tag if actually visible in THIS image
5. Return ONLY a valid JSON array of tag names
6. Do not include explanations, reasoning, or any text outside the JSON array
7. Do not wrap the response in markdown code blocks

Example correct response format:
["Brick", "Large Windows", "Modern Architecture", "Parking"]

Example incorrect response format:
\`\`\`json
["Brick", "Large Windows"]
\`\`\`

Return only the JSON array, nothing else.`;

    console.log(`🤖 Analyzing image: ${normalizedUrl.substring(0, 60)}...`);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: normalizedUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    const content = response.choices[0].message.content || '[]';

    console.log(`📝 AI Response: ${content}`);

    let tags: string[] = [];
    try {
      tags = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          tags = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0]);
          tags = [];
        }
      }
    }

    const validTagNames = new Set(availableTags.map((t: any) => t.name));
    const validatedTags = tags.filter(tag => validTagNames.has(tag));

    console.log(`✅ Validated tags: ${validatedTags.join(', ')}`);

    return NextResponse.json({
      success: true,
      tags: validatedTags,
      tokensUsed: response.usage?.total_tokens || 0,
      rawResponse: content
    });

  } catch (error: any) {
    console.error('❌ Error analyzing image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
