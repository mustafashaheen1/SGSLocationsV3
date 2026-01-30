import { NextRequest, NextResponse } from 'next/server';
import { jsonResponseNoCache } from '@/lib/api-helpers';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const {
      propertyName,
      categoryName,
      subCategoryName,
      city,
      address,
      propertyTags,
      gridImageUrls,  // Array of 6 primary image URLs
      subHeading,     // Existing sub-heading for context
      description,    // Existing description for context
    } = await request.json();

    console.log('=== PROPERTY CONTENT GENERATION REQUEST ===');
    console.log('Property:', propertyName);
    console.log('Category:', categoryName, '>', subCategoryName);
    console.log('Location:', city);
    console.log('Tags:', propertyTags?.length || 0);
    console.log('Images:', gridImageUrls?.length || 0);

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return jsonResponseNoCache(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Validate inputs
    if (!propertyName || !categoryName || !city) {
      return jsonResponseNoCache(
        { error: 'Missing required property information' },
        { status: 400 }
      );
    }

    const openai = getOpenAI();

    // Build the prompt
    const systemPrompt = `You are an expert real estate copywriter specializing in film and photography location descriptions. Your task is to create compelling content for property listings.

Generate:
1. A public name (max 30 characters): A catchy, descriptive name that captures the property's essence
2. A sub-heading (max 180 characters): A catchy, SEO-friendly title that highlights the property's unique selling points
3. A description (75-150 words): An engaging, detailed description that makes the property attractive for filmmakers and photographers

Requirements:
- Public name must be 30 characters or less, using proper title case
- Sub-heading must be 180 characters or less
- Be specific and memorable
- Highlight key features or architectural style visible in images
- Emphasize suitability for filming/photography
- Use professional, engaging language
- Focus on visual appeal and versatility
- DO NOT use generic phrases like "nestled in" or "testament to"
- Be authentic and specific to this property
- Examples of public names: "Modern Loft Downtown", "Victorian Garden Estate", "Industrial Warehouse Space"

Return ONLY a JSON object with this exact structure:
{
  "public_name": "your public name here",
  "sub_heading": "your sub-heading here",
  "description": "your description here"
}`;

    const userPrompt = `Create a public display name for this property:

**Current Internal Code**: ${propertyName}
**Type**: ${subCategoryName || categoryName}
**Category**: ${categoryName}
**Location**: ${city}${address ? `, ${address}` : ''}
**Features/Tags**: ${propertyTags?.join(', ') || 'None specified'}
${subHeading ? `**Sub-heading**: ${subHeading}` : ''}
${description ? `**Description**: ${description}` : ''}

${gridImageUrls && gridImageUrls.length > 0 ? `**Images**: ${gridImageUrls.length} images provided for visual analysis` : '**Images**: No images provided'}

Analyze the property details${gridImageUrls && gridImageUrls.length > 0 ? ', existing content, and images' : ' and existing content'} to create a compelling public name.`;

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
        ],
      },
    ];

    // Add images if provided
    if (gridImageUrls && gridImageUrls.length > 0) {
      const imageContents = gridImageUrls.slice(0, 6).map((url: string) => ({
        type: 'image_url',
        image_url: {
          url: url,
          detail: 'high' as const,
        },
      }));

      messages[1].content.push(...imageContents);
    }

    console.log('Sending request to OpenAI GPT-4o...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 800,
      temperature: 0.7,  // More creative than tag analysis
      response_format: { type: 'json_object' },
    });

    console.log('OpenAI response received');
    console.log('Tokens used:', response.usage?.total_tokens || 0);

    const content = response.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    // Validate response structure
    if (!result.public_name || !result.sub_heading || !result.description) {
      throw new Error('Invalid response format from AI - missing required fields');
    }

    // Ensure public_name is within character limit
    if (result.public_name.length > 30) {
      result.public_name = result.public_name.substring(0, 30).trim();
    }

    // Ensure sub_heading is within character limit
    if (result.sub_heading.length > 200) {
      result.sub_heading = result.sub_heading.substring(0, 197) + '...';
    }

    console.log('✓ Content generated successfully');
    console.log('Public name:', result.public_name, `(${result.public_name.length} chars)`);
    console.log('Sub-heading length:', result.sub_heading.length);
    console.log('Description length:', result.description.length);

    return jsonResponseNoCache({
      success: true,
      public_name: result.public_name,
      sub_heading: result.sub_heading,
      description: result.description,
      tokensUsed: response.usage?.total_tokens || 0,
    });

  } catch (error: any) {
    console.error('❌ Content generation error:', error);
    return jsonResponseNoCache(
      {
        error: 'Failed to generate content',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
