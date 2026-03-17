import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  try {
    const { businessName, priorityScore, issues, recommendations, completenessScore, rating, totalReviews } = await request.json();

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Build the prompt for GPT-4
    const prompt = `You are a Local SEO expert creating an actionable roadmap for optimizing a Google Business Profile.

Business: ${businessName}
Current State:
- Priority Score: ${priorityScore}/100 (higher = more problems)
- Completeness: ${completenessScore}%
- Rating: ${rating} stars
- Reviews: ${totalReviews}

Issues Found:
${issues.map((issue: any, i: number) => `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title} (-${issue.points} pts)
   ${issue.description}`).join('\n\n')}

Current Recommendations:
${recommendations.map((rec: any, i: number) => `${i + 1}. [${rec.priority}] ${rec.title} (${rec.impact} Impact)
   ${rec.description}`).join('\n\n')}

Create a detailed, actionable GMB optimization roadmap with:

1. **WEEK 1: QUICK WINS** (Immediate Actions)
   - List 3-5 tasks that can be done immediately
   - Focus on high-impact, low-effort fixes
   - Include specific steps and time estimates

2. **MONTH 1: BUILD MOMENTUM** (Foundation Building)
   - List 5-7 strategic actions
   - Focus on building systems and processes
   - Include success metrics

3. **MONTHS 2-3: LONG-TERM OPTIMIZATION** (Sustained Growth)
   - List 4-6 ongoing activities
   - Focus on competitive advantages
   - Include scaling strategies

4. **EXPECTED OUTCOMES**
   - Projected improvement in priority score
   - Estimated increase in visibility/calls
   - Timeline for seeing results

Format each task as:
**Task Name** (Time: X hours)
- Specific action steps
- Why it matters
- Expected impact

Make it professional, specific, and actionable. Use bullet points and clear formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Local SEO consultant specializing in Google Business Profile optimization. Create detailed, actionable roadmaps that clients can implement immediately.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const roadmap = completion.choices[0].message.content;

    return NextResponse.json({
      roadmap,
      usage: {
        tokens: completion.usage?.total_tokens,
        cost: ((completion.usage?.total_tokens || 0) * 0.00003).toFixed(4), // Rough estimate
      },
    });
  } catch (error: any) {
    console.error('Roadmap generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate roadmap' },
      { status: 500 }
    );
  }
}
