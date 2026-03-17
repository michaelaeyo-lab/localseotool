import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  opportunity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url, businessDescription, manualKeywords, location } = await request.json();

    if (!url && !businessDescription) {
      return NextResponse.json(
        { error: 'Website URL or business description is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log('Generating keyword intelligence...');

    // Build prompt based on available inputs
    let prompt = `Generate the top 20 most valuable SEO keywords for this business:\n\n`;

    if (url) {
      prompt += `Website: ${url}\n`;
    }

    if (businessDescription) {
      prompt += `Business: ${businessDescription}\n`;
    }

    if (location) {
      prompt += `Location: ${location} (include local SEO keywords)\n`;
    }

    if (manualKeywords && manualKeywords.length > 0) {
      prompt += `\nSeed Keywords: ${manualKeywords.join(', ')}\n`;
      prompt += `Expand on these seed keywords with related variations and long-tail phrases.\n`;
    }

    prompt += `
For each keyword, estimate:
- Search volume (0-100000 monthly searches)
- Difficulty (0-100, where 100 is hardest to rank)
- Opportunity score (0-100, based on relevance, volume, and competition)

Focus on keywords that:
- Are highly relevant to this business
- Have commercial or local intent
- Have reasonable search volume
- Include long-tail variations
- Mix of branded, informational, and transactional intent
${location ? '- Include location-specific keywords' : ''}

Return JSON array:
[
  {
    "keyword": "keyword phrase",
    "volume": 5000,
    "difficulty": 45,
    "opportunity": 85
  }
]

Sort by opportunity score descending. Return only valid JSON, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO keyword researcher. Generate valuable, data-driven keyword suggestions. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content || '[]';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let keywords: KeywordData[];
    try {
      keywords = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse keywords:', cleanedResponse);
      keywords = [];
    }

    // If manual keywords were provided, ensure they're included
    if (manualKeywords && manualKeywords.length > 0) {
      manualKeywords.forEach((kw: string) => {
        if (!keywords.find(k => k.keyword.toLowerCase() === kw.toLowerCase())) {
          keywords.push({
            keyword: kw,
            volume: 1000,
            difficulty: 50,
            opportunity: 70,
          });
        }
      });
    }

    // Sort by opportunity score
    keywords.sort((a, b) => b.opportunity - a.opportunity);

    // Limit to 20
    keywords = keywords.slice(0, 20);

    console.log(`Generated ${keywords.length} keywords`);

    return NextResponse.json({
      keywords: keywords,
      totalKeywords: keywords.length,
    });
  } catch (error: any) {
    console.error('Keyword generation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate keywords' },
      { status: 500 }
    );
  }
}
