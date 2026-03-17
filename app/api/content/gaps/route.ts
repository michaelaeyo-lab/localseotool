import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ContentGap {
  keyword: string;
  opportunity: string;
  difficulty: 'Low' | 'Medium' | 'High';
  topicsCovered: string[];
  missingTopics: string[];
  competitorInsights: string[];
  recommendedWordCount: number;
  contentType: string;
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl, serpResults, keywords } = await request.json();

    if (!serpResults || serpResults.length === 0) {
      return NextResponse.json(
        { error: 'SERP results are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Analyzing content gaps for ${serpResults.length} keywords`);

    const gaps: ContentGap[] = [];

    for (const serpResult of serpResults) {
      try {
        // Analyze top SERP results
        const serpContent = serpResult.topResults
          .slice(0, 5)
          .map((r: any, i: number) => `${i + 1}. ${r.title}\n   ${r.snippet}`)
          .join('\n\n');

        const paaContent = serpResult.paa.length > 0
          ? `\nPeople Also Ask:\n${serpResult.paa.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
          : '';

        const relatedContent = serpResult.relatedSearches.length > 0
          ? `\nRelated Searches:\n${serpResult.relatedSearches.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}`
          : '';

        const prompt = `Analyze content opportunity for the keyword: "${serpResult.keyword}"

Website to create content for: ${websiteUrl || 'N/A'}

TOP RANKING SERP RESULTS:
${serpContent}
${paaContent}
${relatedContent}

Analyze the top-ranking content and identify:
1. What key topics and subtopics are top pages covering?
2. What specific topics must be included to compete?
3. What content type performs best (how-to, listicle, comparison, guide, pillar)?
4. Estimated word count needed based on top results
5. What makes this a good or difficult opportunity?

Return a JSON object with this structure:
{
  "opportunity": "Brief description of the content opportunity (1-2 sentences)",
  "difficulty": "Low" | "Medium" | "High",
  "topicsCovered": ["topic 1", "topic 2", ...] (topics competitors cover),
  "missingTopics": ["missing 1", "missing 2", ...] (topics to differentiate),
  "competitorInsights": ["insight 1", "insight 2", ...] (what makes top results rank),
  "recommendedWordCount": 1500,
  "contentType": "how-to" | "listicle" | "guide" | "comparison" | "pillar"
}

Return only valid JSON, no markdown.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert SEO content strategist. Analyze SERP results and identify content gaps and opportunities. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.4,
          max_tokens: 1500,
        });

        const responseText = completion.choices[0].message.content || '{}';
        const cleanedResponse = responseText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();

        let gapData: any;
        try {
          gapData = JSON.parse(cleanedResponse);
        } catch (parseError) {
          console.error('Failed to parse gap analysis:', cleanedResponse);
          continue;
        }

        gaps.push({
          keyword: serpResult.keyword,
          opportunity: gapData.opportunity || '',
          difficulty: gapData.difficulty || 'Medium',
          topicsCovered: gapData.topicsCovered || [],
          missingTopics: gapData.missingTopics || [],
          competitorInsights: gapData.competitorInsights || [],
          recommendedWordCount: gapData.recommendedWordCount || 1500,
          contentType: gapData.contentType || 'guide',
        });

        console.log(`Gap analysis completed for: ${serpResult.keyword}`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`Gap analysis error for "${serpResult.keyword}":`, error.message);
        continue;
      }
    }

    console.log(`Total gaps identified: ${gaps.length}`);

    return NextResponse.json({
      gaps: gaps,
      count: gaps.length,
    });
  } catch (error: any) {
    console.error('Gap analysis error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze gaps' },
      { status: 500 }
    );
  }
}
