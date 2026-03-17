import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface SerpFeature {
  keyword: string;
  features: {
    hasFeaturedSnippet: boolean;
    featuredSnippetType?: 'paragraph' | 'list' | 'table' | 'video';
    featuredSnippetContent?: string;
    hasPAA: boolean;
    paaQuestions: string[];
    hasImagePack: boolean;
    hasVideoPack: boolean;
    hasLocalPack: boolean;
    hasKnowledgePanel: boolean;
  };
  opportunities: {
    snippetOpportunity: string;
    paaStrategy: string;
    imageStrategy: string;
    videoStrategy: string;
    schemaRecommendations: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const { serpResults, keywords } = await request.json();

    if (!serpResults || serpResults.length === 0) {
      return NextResponse.json(
        { error: 'SERP results are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Analyzing SERP features for ${serpResults.length} keywords`);

    const features: SerpFeature[] = [];

    for (const serp of serpResults) {
      // Analyze SERP features
      const hasPAA = serp.paa && serp.paa.length > 0;
      const paaQuestions = serp.paa || [];

      // Use AI to analyze snippet opportunity
      const prompt = `Analyze SERP features for the keyword: "${serp.keyword}"

Top SERP Results:
${serp.topResults.slice(0, 3).map((r: any, i: number) =>
  `${i + 1}. ${r.title}\n   ${r.snippet}`
).join('\n\n')}

People Also Ask Questions:
${paaQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Analyze and provide:
1. Featured snippet opportunity and strategy
2. Best approach for People Also Ask optimization
3. Image optimization strategy
4. Video content opportunity
5. Schema markup recommendations (specific types)

Return JSON:
{
  "snippetOpportunity": "Assessment and strategy for featured snippet",
  "paaStrategy": "How to optimize for PAA questions",
  "imageStrategy": "Image optimization recommendations",
  "videoStrategy": "Video content recommendations",
  "schemaRecommendations": ["Article schema", "FAQ schema", "HowTo schema", etc.]
}

Return only valid JSON, no markdown.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in SERP features and structured data optimization. Analyze search results and provide actionable strategies for capturing SERP features. Return only valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const responseText = completion.choices[0].message.content || '{}';
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      let opportunities: any;
      try {
        opportunities = JSON.parse(cleanedResponse);
      } catch {
        opportunities = {
          snippetOpportunity: 'Unable to analyze',
          paaStrategy: 'Optimize content to answer PAA questions directly',
          imageStrategy: 'Add relevant images with descriptive alt text',
          videoStrategy: 'Consider creating video content for this topic',
          schemaRecommendations: ['Article', 'FAQ'],
        };
      }

      features.push({
        keyword: serp.keyword,
        features: {
          hasFeaturedSnippet: false, // Would need SERP API data
          hasPAA: hasPAA,
          paaQuestions: paaQuestions,
          hasImagePack: false,
          hasVideoPack: false,
          hasLocalPack: false,
          hasKnowledgePanel: false,
        },
        opportunities: opportunities,
      });

      console.log(`SERP features analyzed for: ${serp.keyword}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
      features: features,
      count: features.length,
    });
  } catch (error: any) {
    console.error('SERP features analysis error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze SERP features' },
      { status: 500 }
    );
  }
}
