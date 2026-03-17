import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface CompetitorIntel {
  keyword: string;
  topCompetitors: Array<{
    domain: string;
    position: number;
    url: string;
    title: string;
    snippet: string;
    estimatedWordCount: number;
    strengths: string[];
    weaknesses: string[];
    contentStructure: string;
    uniqueAngles: string[];
  }>;
  competitiveGaps: string[];
  winningPatterns: string[];
  recommendations: string[];
  difficultyAssessment: string;
}

export async function POST(request: NextRequest) {
  try {
    const { serpResults, keyword } = await request.json();

    if (!serpResults || !keyword) {
      return NextResponse.json(
        { error: 'SERP results and keyword are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Analyzing competitor intelligence for: ${keyword}`);

    // Find the SERP result for this keyword
    const serpData = Array.isArray(serpResults)
      ? serpResults.find((s: any) => s.keyword === keyword)
      : serpResults;

    if (!serpData || !serpData.topResults) {
      return NextResponse.json(
        { error: 'No SERP data found for keyword' },
        { status: 404 }
      );
    }

    const topResults = serpData.topResults.slice(0, 5);

    // Analyze each competitor with AI
    const prompt = `Perform deep competitor analysis for the keyword: "${keyword}"

Top 5 Ranking Pages:

${topResults.map((r: any, i: number) => `${i + 1}. Position ${r.position}
   Domain: ${r.domain}
   Title: ${r.title}
   Snippet: ${r.snippet}
   URL: ${r.url}`).join('\n\n')}

For EACH of the top 5 competitors, analyze:
1. Estimated word count (based on snippet depth)
2. Key strengths (what makes their content rank well)
3. Potential weaknesses or gaps
4. Content structure and format (how-to, list, guide, etc.)
5. Unique angles or differentiators

Then provide:
- Competitive gaps (what none of them are covering well)
- Winning patterns (common elements among top rankers)
- Strategic recommendations to outrank them
- Difficulty assessment (realistic chances of ranking)

Return JSON:
{
  "competitors": [
    {
      "domain": "example.com",
      "position": 1,
      "estimatedWordCount": 2500,
      "strengths": ["Comprehensive coverage", "Expert author"],
      "weaknesses": ["Outdated information", "Poor mobile UX"],
      "contentStructure": "Ultimate guide with step-by-step",
      "uniqueAngles": ["Includes video tutorials", "Industry-specific examples"]
    }
  ],
  "competitiveGaps": ["Missing topic 1", "No coverage of X"],
  "winningPatterns": ["All use listicle format", "All include stats"],
  "recommendations": ["Add unique data", "Create better visuals"],
  "difficultyAssessment": "Medium - Can rank with comprehensive content and strong backlinks"
}

Return only valid JSON, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO competitive analyst. Perform deep analysis of SERP competitors to identify opportunities and strategies. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 2500,
    });

    const responseText = completion.choices[0].message.content || '{}';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let analysis: any;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse competitor analysis:', cleanedResponse);
      // Fallback analysis
      analysis = {
        competitors: topResults.map((r: any) => ({
          domain: r.domain,
          position: r.position,
          estimatedWordCount: 1500,
          strengths: ['Strong domain authority'],
          weaknesses: ['Generic content'],
          contentStructure: 'Blog post',
          uniqueAngles: [],
        })),
        competitiveGaps: ['Unable to analyze'],
        winningPatterns: ['Unable to determine'],
        recommendations: ['Create comprehensive, unique content'],
        difficultyAssessment: 'Medium',
      };
    }

    // Merge with original SERP data
    const competitors = (analysis.competitors || []).map((comp: any, i: number) => ({
      domain: comp.domain || topResults[i]?.domain,
      position: comp.position || topResults[i]?.position || i + 1,
      url: topResults[i]?.url || '',
      title: topResults[i]?.title || '',
      snippet: topResults[i]?.snippet || '',
      estimatedWordCount: comp.estimatedWordCount || 1500,
      strengths: comp.strengths || [],
      weaknesses: comp.weaknesses || [],
      contentStructure: comp.contentStructure || 'Unknown',
      uniqueAngles: comp.uniqueAngles || [],
    }));

    const intel: CompetitorIntel = {
      keyword: keyword,
      topCompetitors: competitors,
      competitiveGaps: analysis.competitiveGaps || [],
      winningPatterns: analysis.winningPatterns || [],
      recommendations: analysis.recommendations || [],
      difficultyAssessment: analysis.difficultyAssessment || 'Medium',
    };

    console.log(`Competitor analysis complete for: ${keyword}`);

    return NextResponse.json({
      intel: intel,
      summary: {
        keyword: keyword,
        competitorsAnalyzed: competitors.length,
        averageWordCount: Math.round(
          competitors.reduce((sum: number, c: any) => sum + c.estimatedWordCount, 0) / competitors.length
        ),
        difficulty: analysis.difficultyAssessment,
      },
    });
  } catch (error: any) {
    console.error('Competitor intelligence error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}
