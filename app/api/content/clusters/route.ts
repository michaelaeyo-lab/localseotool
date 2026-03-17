import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ContentCluster {
  pillarTopic: string;
  pillarKeyword: string;
  supportingContent: Array<{
    topic: string;
    keyword: string;
    contentType: string;
    priority: number;
  }>;
  internalLinkingStrategy: string;
}

export async function POST(request: NextRequest) {
  try {
    const { gaps, keywords } = await request.json();

    if (!gaps || gaps.length === 0) {
      return NextResponse.json(
        { error: 'Content gaps are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Creating content clusters from ${gaps.length} gaps`);

    // Prepare gap data for analysis
    const gapSummary = gaps
      .map((gap: any, i: number) => `${i + 1}. Keyword: "${gap.keyword}"
   Opportunity: ${gap.opportunity}
   Missing Topics: ${gap.missingTopics.join(', ')}
   Content Type: ${gap.contentType}`)
      .join('\n\n');

    const prompt = `Create SEO content clusters from these content opportunities:

${gapSummary}

Create 2-4 content clusters following the hub-and-spoke model:
- Each cluster has ONE pillar page (comprehensive, authoritative guide)
- 3-5 supporting pages (detailed subtopics that link to the pillar)

For each cluster:
1. Identify the main pillar topic and keyword
2. List supporting content pieces
3. Assign priority (1-5, where 1 is highest)
4. Describe internal linking strategy

Return a JSON array with this structure:
[
  {
    "pillarTopic": "Main comprehensive topic",
    "pillarKeyword": "primary keyword",
    "supportingContent": [
      {
        "topic": "Supporting topic 1",
        "keyword": "target keyword",
        "contentType": "how-to" | "listicle" | "comparison" | "guide",
        "priority": 1
      }
    ],
    "internalLinkingStrategy": "How to link these pages together"
  }
]

Return only valid JSON, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO content strategist specializing in topical authority and content clustering. Create hub-and-spoke content clusters. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0].message.content || '[]';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let clusters: ContentCluster[];
    try {
      clusters = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse clusters:', cleanedResponse);
      throw new Error('Invalid JSON response from AI');
    }

    console.log(`Created ${clusters.length} content clusters`);

    return NextResponse.json({
      clusters: clusters,
      count: clusters.length,
    });
  } catch (error: any) {
    console.error('Content clustering error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create content clusters' },
      { status: 500 }
    );
  }
}
