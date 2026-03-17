import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ContentBrief {
  title: string;
  keyword: string;
  targetWordCount: number;
  outline: string[];
  keywordsToInclude: string[];
  competitorInsights: string[];
  searchIntent: string;
  targetAudience: string;
  callToAction: string;
  metaDescription: string;
  internalLinks: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { clusters, gaps, serpResults } = await request.json();

    if (!clusters || clusters.length === 0) {
      return NextResponse.json(
        { error: 'Content clusters are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Generating content briefs for ${clusters.length} clusters`);

    const briefs: ContentBrief[] = [];

    for (const cluster of clusters) {
      // Generate brief for pillar page
      const pillarBrief = await generateBrief(
        openai,
        cluster.pillarTopic,
        cluster.pillarKeyword,
        'pillar',
        gaps,
        serpResults
      );
      briefs.push(pillarBrief);

      // Generate briefs for supporting content (limit to top 5 priority)
      const topSupporting = cluster.supportingContent
        .sort((a: any, b: any) => a.priority - b.priority)
        .slice(0, 5);

      for (const support of topSupporting) {
        const supportBrief = await generateBrief(
          openai,
          support.topic,
          support.keyword,
          support.contentType,
          gaps,
          serpResults
        );
        briefs.push(supportBrief);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Generated ${briefs.length} content briefs`);

    return NextResponse.json({
      briefs: briefs,
      count: briefs.length,
    });
  } catch (error: any) {
    console.error('Content brief generation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content briefs' },
      { status: 500 }
    );
  }
}

async function generateBrief(
  openai: OpenAI,
  topic: string,
  keyword: string,
  contentType: string,
  gaps: any[],
  serpResults: any[]
): Promise<ContentBrief> {
  // Find relevant gap data
  const relevantGap = gaps.find((g: any) =>
    g.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(g.keyword.toLowerCase())
  );

  // Find relevant SERP data
  const relevantSerp = serpResults?.find((s: any) =>
    s.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
    keyword.toLowerCase().includes(s.keyword.toLowerCase())
  );

  const missingTopics = relevantGap?.missingTopics || [];
  const competitorInsights = relevantGap?.competitorInsights || [];
  const paaQuestions = relevantSerp?.paa || [];
  const recommendedWordCount = relevantGap?.recommendedWordCount || 1500;

  const prompt = `Create a detailed SEO content brief:

Topic: ${topic}
Target Keyword: ${keyword}
Content Type: ${contentType}

Missing Topics to Cover:
${missingTopics.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')}

Competitor Insights:
${competitorInsights.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

People Also Ask:
${paaQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Create a comprehensive content brief with:
1. Optimized SEO title (H1)
2. Target word count
3. Detailed outline (H2 and H3 headings)
4. Related keywords to include naturally
5. Search intent analysis
6. Target audience description
7. Recommended call-to-action
8. Meta description (under 160 characters)
9. Suggested internal links (topics to link to)

Return JSON with this structure:
{
  "title": "SEO-optimized H1 title",
  "keyword": "${keyword}",
  "targetWordCount": ${recommendedWordCount},
  "outline": ["H2: Introduction", "H2: Section 1", "H3: Subsection", ...],
  "keywordsToInclude": ["related keyword 1", "keyword 2", ...],
  "competitorInsights": ["insight 1", "insight 2", ...],
  "searchIntent": "informational" | "transactional" | "navigational" | "commercial",
  "targetAudience": "Description of target reader",
  "callToAction": "Recommended CTA",
  "metaDescription": "SEO meta description under 160 chars",
  "internalLinks": ["topic 1 to link to", "topic 2", ...]
}

Return only valid JSON, no markdown.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an expert SEO content strategist. Create detailed, actionable content briefs that writers can follow to create top-ranking content. Return only valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.4,
    max_tokens: 2000,
  });

  const responseText = completion.choices[0].message.content || '{}';
  const cleanedResponse = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const brief = JSON.parse(cleanedResponse);
    console.log(`Generated brief for: ${topic}`);
    return brief;
  } catch (parseError) {
    console.error('Failed to parse brief:', cleanedResponse);
    // Return a basic brief
    return {
      title: topic,
      keyword: keyword,
      targetWordCount: recommendedWordCount,
      outline: ['Introduction', 'Main Content', 'Conclusion'],
      keywordsToInclude: [keyword],
      competitorInsights: competitorInsights,
      searchIntent: 'informational',
      targetAudience: 'General audience',
      callToAction: 'Contact us for more information',
      metaDescription: `Learn about ${topic}. Comprehensive guide covering everything you need to know.`,
      internalLinks: [],
    };
  }
}
