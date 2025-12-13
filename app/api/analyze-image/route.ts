import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import OpenAI from 'openai';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import { normalizeUrl } from '@/lib/url-utils';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, availableTags } = await request.json();

    console.log('\n=== IMAGE ANALYSIS REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Image URL:', imageUrl ? `${imageUrl.substring(0, 80)}...` : 'MISSING');
    console.log('Available tags count:', availableTags?.length || 0);
    console.log('OpenAI API key present:', !!process.env.OPENAI_API_KEY);

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not configured!');
      return jsonResponseNoCache(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!imageUrl) {
      console.error('❌ No image URL provided');
      return jsonResponseNoCache(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!availableTags || availableTags.length === 0) {
      console.error('❌ No available tags provided');
      return jsonResponseNoCache(
        { error: 'No tags available for analysis' },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(imageUrl);
    console.log('Normalized URL:', normalizedUrl !== imageUrl ? 'Modified' : 'Unchanged');

    const tagsByCategory: Record<string, string[]> = {};
    availableTags.forEach((tag: any) => {
      const filterName = tag.filter_name || 'Other';
      if (!tagsByCategory[filterName]) {
        tagsByCategory[filterName] = [];
      }
      tagsByCategory[filterName].push(tag.name);
    });

    console.log('Tag categories:', Object.keys(tagsByCategory));
    Object.entries(tagsByCategory).forEach(([category, tags]) => {
      console.log(`  ${category}: ${tags.length} tags`);
    });

    const tagCategoriesText = Object.entries(tagsByCategory)
      .map(([category, tags]) =>
        `${category} (${tags.length} options):\n${tags.slice(0, 50).map(t => `- ${t}`).join('\n')}${tags.length > 50 ? `\n... and ${tags.length - 50} more` : ''}`
      )
      .join('\n\n');

    const prompt = `You are analyzing a property/filming location image. Your task is to identify which tags from the provided list accurately describe what is visible in this image.

Available tag categories and options:

${tagCategoriesText}

CRITICAL INSTRUCTIONS:
1. Only select tags that are CLEARLY VISIBLE or DIRECTLY APPLICABLE in this specific image
2. Be conservative - only tag what you're confident about
3. Only use tags from the provided list above - do not create new tags
4. For architectural styles, only tag if the style is clearly identifiable
5. For features like pools, garages, etc., only tag if actually visible
6. Return ONLY a JSON array of tag names that match EXACTLY with the provided list
7. Do not include any explanations or text outside the JSON array
8. Do not wrap the response in markdown code blocks

Example response: ["Modern", "Pool", "2 Story", "Glass Walls"]

Analyze the image and return the matching tags:`;

    console.log('🤖 Sending request to GPT-4o...');
    console.log('Model: gpt-4o');
    console.log('Prompt length:', prompt.length, 'characters');

    const openai = getOpenAI();
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
    console.log('📝 Raw GPT-4o response:', content);

    let tags: string[] = [];
    try {
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      tags = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('Failed to parse as JSON, trying to extract array:', e);

      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          tags = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted JSON array from response');
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError);
          tags = [];
        }
      }
    }

    console.log(`🏷️ Extracted ${tags.length} tags:`, tags);

    const validTagNames = new Set(availableTags.map((t: any) => t.name));
    const validatedTags = tags.filter(tag => {
      const isValid = validTagNames.has(tag);
      if (!isValid) {
        console.warn(`  ⚠️ Rejected invalid tag: "${tag}"`);
      }
      return isValid;
    });

    const rejectedCount = tags.length - validatedTags.length;
    if (rejectedCount > 0) {
      console.log(`  ⚠️ Rejected ${rejectedCount} invalid tags`);
    }

    console.log(`✅ Final validated tags (${validatedTags.length}):`, validatedTags);
    console.log('Tokens used:', response.usage?.total_tokens || 0);
    console.log('=== END ANALYSIS ===\n');

    return jsonResponseNoCache({
      success: true,
      tags: validatedTags,
      tokensUsed: response.usage?.total_tokens || 0,
      rawResponse: content,
      totalAvailableTags: availableTags.length,
      debug: {
        categoriesCount: Object.keys(tagsByCategory).length,
        promptLength: prompt.length,
        rawTagsCount: tags.length,
        validatedTagsCount: validatedTags.length
      }
    });

  } catch (error: any) {
    console.error('❌ Error in analyze-image API:', error);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);

    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
    }

    return jsonResponseNoCache(
      {
        error: error.message || 'Failed to analyze image',
        type: error.type || 'unknown',
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
