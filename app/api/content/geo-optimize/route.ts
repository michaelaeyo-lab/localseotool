import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface GeoVariation {
  location: string;
  content: string;
  localKeywords: string[];
  localReferences: string[];
  modifications: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { content, targetLocations, baseKeyword } = await request.json();

    if (!content || !targetLocations || targetLocations.length === 0) {
      return NextResponse.json(
        { error: 'Content and target locations are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Creating GEO variations for ${targetLocations.length} locations`);

    const variations: GeoVariation[] = [];

    for (const location of targetLocations.slice(0, 5)) { // Limit to 5 locations
      const prompt = `Adapt this content for local SEO targeting ${location}:

BASE KEYWORD: ${baseKeyword}
TARGET LOCATION: ${location}

ORIGINAL CONTENT:
${content.substring(0, 3000)}

Create a location-optimized version that:
1. Naturally integrates "${location}" throughout
2. Updates examples to be location-specific
3. References local landmarks, neighborhoods, or characteristics
4. Adjusts service areas, pricing, or regulations if relevant
5. Maintains the same structure and tone
6. Adds local keywords naturally

Also provide:
- List of local keywords added
- List of local references made
- Summary of key modifications

Return JSON:
{
  "content": "Full optimized content...",
  "localKeywords": ["keyword + location", ...],
  "localReferences": ["local landmark", "neighborhood", ...],
  "modifications": ["Changed X to Y", "Added local example", ...]
}

Return only valid JSON, no markdown.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in local SEO content optimization. Create natural, location-specific content variations that maintain quality while targeting local searches. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 4000,
      });

      const responseText = completion.choices[0].message.content || '{}';
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      let variation: any;
      try {
        variation = JSON.parse(cleanedResponse);
      } catch {
        variation = {
          content: content.replace(new RegExp('\\b(service|business|company)\\b', 'gi'), `$1 in ${location}`),
          localKeywords: [`${baseKeyword} ${location}`],
          localReferences: [location],
          modifications: ['Added location references'],
        };
      }

      variations.push({
        location: location,
        content: variation.content || content,
        localKeywords: variation.localKeywords || [],
        localReferences: variation.localReferences || [],
        modifications: variation.modifications || [],
      });

      console.log(`GEO variation created for: ${location}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      variations: variations,
      summary: {
        locations: variations.length,
        baseKeyword: baseKeyword,
        totalLocalKeywords: variations.reduce((sum, v) => sum + v.localKeywords.length, 0),
      },
    });
  } catch (error: any) {
    console.error('GEO optimization error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create GEO variations' },
      { status: 500 }
    );
  }
}
