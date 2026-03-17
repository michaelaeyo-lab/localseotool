import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { brief, location, websiteUrl, businessName } = await request.json();

    if (!brief) {
      return NextResponse.json(
        { error: 'Content brief is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Generating content for: ${brief.title}`);

    // Extract brand name from URL if not provided
    let brandName = businessName;
    if (!brandName && websiteUrl) {
      try {
        const domain = new URL(websiteUrl).hostname.replace('www.', '');
        brandName = domain.split('.')[0];
        // Capitalize first letter
        brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
      } catch (e) {
        brandName = 'the business';
      }
    }

    const locationContext = location
      ? `\n\nLOCATION CONTEXT: This content is specifically for ${brandName || 'a business'} serving customers in ${location}. Naturally weave in local references, examples, and context throughout the article. Mention ${location} in the introduction and conclusion.`
      : '';

    const brandContext = brandName
      ? `\n\nBRAND: Write this content for ${brandName}. Reference ${brandName} naturally 2-3 times throughout the article, especially in the introduction and conclusion. Position ${brandName} as a trusted solution.`
      : '';

    const prompt = `Write a complete, SEO-optimized blog post based on this content brief:

TITLE: ${brief.title}
TARGET KEYWORD: ${brief.keyword}
TARGET WORD COUNT: ${brief.targetWordCount} words
SEARCH INTENT: ${brief.searchIntent}
TARGET AUDIENCE: ${brief.targetAudience}
${brandContext}
${locationContext}

OUTLINE TO FOLLOW:
${brief.outline.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}

KEYWORDS TO INCLUDE NATURALLY:
${brief.keywordsToInclude.join(', ')}

COMPETITOR INSIGHTS (USE FOR CONTEXT, DO NOT MENTION COMPETITOR NAMES):
${brief.competitorInsights.map((c: string, i: number) => `- ${c}`).join('\n')}

CALL TO ACTION:
${brief.callToAction}

CRITICAL WRITING GUIDELINES:
1. Write in a professional, engaging, authoritative tone
2. Use the exact outline structure provided
3. Include the target keyword in the first paragraph
4. Use H2 and H3 headings as specified in the outline
5. Write comprehensive, detailed paragraphs with concrete examples
6. Include relevant statistics, data, and actionable advice
7. Naturally incorporate related keywords throughout
8. Add a compelling call-to-action at the end
9. Write approximately ${brief.targetWordCount} words
10. Use markdown formatting (# for H1, ## for H2, ### for H3)
11. DO NOT include meta descriptions or SEO instructions in the content

GUARDRAILS - STRICTLY FOLLOW:
${brandName ? `12. Mention ${brandName} naturally 2-3 times (introduction, body, conclusion)` : '12. Focus on providing value to the reader'}
${location ? `13. Reference ${location} in the introduction and conclusion, plus 1-2 times in the body` : '13. Keep content relevant and focused'}
14. NEVER mention specific competitor names, products, or brands
15. DO NOT use generic phrases like "competitive landscape" or "industry players"
16. Focus on YOUR brand/business as the solution, not others
17. Use "businesses" or "service providers" instead of naming competitors
18. Write with authority and expertise, not as a neutral observer

Write the complete article now in markdown format:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer creating branded content. Write comprehensive, engaging, and SEO-optimized blog posts that:
- Rank well in search engines
- Provide genuine value to readers
- Naturally promote the client's brand/business
- Include local context when specified
- NEVER mention competitor names or brands
- Position the client as the trusted authority
- Use markdown format with proper heading hierarchy
- Write with confidence and expertise, not neutrality`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content || '';
    const wordCount = content.split(/\s+/).length;

    console.log(`Generated ${wordCount} words for: ${brief.title}`);

    // Generate SEO score
    const seoScore = calculateSEOScore(content, brief);

    return NextResponse.json({
      content: content,
      wordCount: wordCount,
      seoScore: seoScore,
      brief: brief,
      usage: {
        tokens: completion.usage?.total_tokens,
        cost: ((completion.usage?.total_tokens || 0) * 0.00003).toFixed(4),
      },
    });
  } catch (error: any) {
    console.error('Content generation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

function calculateSEOScore(content: string, brief: any): {
  score: number;
  checks: Array<{ item: string; passed: boolean; details: string }>;
} {
  const checks = [];
  let score = 0;
  const maxScore = 100;

  const contentLower = content.toLowerCase();
  const wordCount = content.split(/\s+/).length;

  // 1. Word count (20 points)
  const targetWordCount = brief.targetWordCount || 1500;
  const wordCountRatio = wordCount / targetWordCount;
  if (wordCountRatio >= 0.8 && wordCountRatio <= 1.2) {
    score += 20;
    checks.push({
      item: 'Word Count',
      passed: true,
      details: `${wordCount} words (target: ${targetWordCount})`,
    });
  } else {
    checks.push({
      item: 'Word Count',
      passed: false,
      details: `${wordCount} words (target: ${targetWordCount})`,
    });
  }

  // 2. Target keyword in first paragraph (15 points)
  const firstPara = content.substring(0, 500).toLowerCase();
  if (firstPara.includes(brief.keyword.toLowerCase())) {
    score += 15;
    checks.push({
      item: 'Keyword in Introduction',
      passed: true,
      details: `"${brief.keyword}" found in first paragraph`,
    });
  } else {
    checks.push({
      item: 'Keyword in Introduction',
      passed: false,
      details: `"${brief.keyword}" not found in first paragraph`,
    });
  }

  // 3. Keyword density (15 points) - should be 1-2%
  const keywordOccurrences = (contentLower.match(new RegExp(brief.keyword.toLowerCase(), 'g')) || []).length;
  const keywordDensity = (keywordOccurrences / wordCount) * 100;
  if (keywordDensity >= 0.5 && keywordDensity <= 2.5) {
    score += 15;
    checks.push({
      item: 'Keyword Density',
      passed: true,
      details: `${keywordDensity.toFixed(2)}% (${keywordOccurrences} times)`,
    });
  } else {
    checks.push({
      item: 'Keyword Density',
      passed: false,
      details: `${keywordDensity.toFixed(2)}% (should be 0.5-2.5%)`,
    });
  }

  // 4. Headings structure (20 points)
  const h2Count = (content.match(/^##\s/gm) || []).length;
  const h3Count = (content.match(/^###\s/gm) || []).length;
  if (h2Count >= 3 && (h2Count + h3Count) >= 5) {
    score += 20;
    checks.push({
      item: 'Heading Structure',
      passed: true,
      details: `${h2Count} H2s, ${h3Count} H3s`,
    });
  } else {
    checks.push({
      item: 'Heading Structure',
      passed: false,
      details: `${h2Count} H2s, ${h3Count} H3s (need at least 3 H2s and 5 total headings)`,
    });
  }

  // 5. Related keywords included (15 points)
  const relatedKeywordsFound = brief.keywordsToInclude.filter((kw: string) =>
    contentLower.includes(kw.toLowerCase())
  ).length;
  const relatedKeywordRatio = relatedKeywordsFound / (brief.keywordsToInclude.length || 1);
  if (relatedKeywordRatio >= 0.6) {
    score += 15;
    checks.push({
      item: 'Related Keywords',
      passed: true,
      details: `${relatedKeywordsFound}/${brief.keywordsToInclude.length} included`,
    });
  } else {
    checks.push({
      item: 'Related Keywords',
      passed: false,
      details: `${relatedKeywordsFound}/${brief.keywordsToInclude.length} included (need 60%+)`,
    });
  }

  // 6. Readability - average sentence length (15 points)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = wordCount / sentences.length;
  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) {
    score += 15;
    checks.push({
      item: 'Readability',
      passed: true,
      details: `${avgSentenceLength.toFixed(1)} words per sentence (good)`,
    });
  } else {
    checks.push({
      item: 'Readability',
      passed: false,
      details: `${avgSentenceLength.toFixed(1)} words per sentence (aim for 15-25)`,
    });
  }

  return {
    score: Math.round(score),
    checks: checks,
  };
}
