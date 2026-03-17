import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface CalendarItem {
  id: string;
  title: string;
  keyword: string;
  contentType: string;
  priority: number;
  opportunityScore: number;
  estimatedEffort: 'Low' | 'Medium' | 'High';
  estimatedImpact: 'Low' | 'Medium' | 'High';
  suggestedPublishDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  dependencies: string[];
  cluster: string;
}

export async function POST(request: NextRequest) {
  try {
    const { briefs, clusters, gaps } = await request.json();

    if (!briefs || briefs.length === 0) {
      return NextResponse.json(
        { error: 'Content briefs are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Creating content calendar for ${briefs.length} items`);

    // Calculate opportunity scores
    const calendarItems: CalendarItem[] = briefs.map((brief: any, index: number) => {
      // Find matching gap for opportunity score
      const matchingGap = gaps?.find((g: any) =>
        g.keyword.toLowerCase() === brief.keyword.toLowerCase()
      );

      const difficulty = matchingGap?.difficulty || 'Medium';
      const wordCount = brief.targetWordCount || 1500;

      // Calculate opportunity score (0-100)
      let opportunityScore = 50;
      if (difficulty === 'Low') opportunityScore += 30;
      else if (difficulty === 'Medium') opportunityScore += 15;

      // Adjust for search intent
      if (brief.searchIntent === 'commercial' || brief.searchIntent === 'transactional') {
        opportunityScore += 10;
      }

      // Estimate effort based on word count and complexity
      let estimatedEffort: 'Low' | 'Medium' | 'High' = 'Medium';
      if (wordCount < 1000) estimatedEffort = 'Low';
      else if (wordCount > 2500) estimatedEffort = 'High';

      // Estimate impact
      let estimatedImpact: 'Low' | 'Medium' | 'High' = 'Medium';
      if (opportunityScore > 75) estimatedImpact = 'High';
      else if (opportunityScore < 50) estimatedImpact = 'Low';

      // Find cluster
      const cluster = clusters?.find((c: any) =>
        c.pillarKeyword === brief.keyword ||
        c.supportingContent?.some((s: any) => s.keyword === brief.keyword)
      );

      return {
        id: `content-${index + 1}`,
        title: brief.title,
        keyword: brief.keyword,
        contentType: matchingGap?.contentType || 'guide',
        priority: index + 1,
        opportunityScore: Math.min(100, opportunityScore),
        estimatedEffort: estimatedEffort,
        estimatedImpact: estimatedImpact,
        suggestedPublishDate: '',
        status: 'Not Started',
        dependencies: [],
        cluster: cluster?.pillarTopic || 'Uncategorized',
      };
    });

    // Use AI to create publishing schedule
    const prompt = `Create a strategic content publishing calendar for these ${calendarItems.length} pieces:

${calendarItems.map((item, i) => `${i + 1}. ${item.title}
   - Keyword: ${item.keyword}
   - Type: ${item.contentType}
   - Effort: ${item.estimatedEffort}
   - Impact: ${item.estimatedImpact}
   - Opportunity: ${item.opportunityScore}/100
   - Cluster: ${item.cluster}`).join('\n\n')}

Create a publishing schedule that:
1. Prioritizes high-impact, low-effort content first (quick wins)
2. Publishes pillar content before supporting content
3. Maintains consistent publishing cadence (2-3 pieces per week)
4. Identifies dependencies (which content should be published first)

For each piece, provide:
- Priority order (1 = publish first)
- Suggested publish date (starting from today, format: YYYY-MM-DD)
- Dependencies (IDs of content that should be published first)

Return a JSON array matching the input order with added fields:
[
  {
    "id": "content-1",
    "priority": 3,
    "suggestedPublishDate": "2026-03-20",
    "dependencies": ["content-2"]
  }
]

Today's date: ${new Date().toISOString().split('T')[0]}

Return only valid JSON array, no markdown.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content strategist specializing in content calendars and publishing schedules. Create strategic, data-driven publishing plans. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0].message.content || '[]';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let schedule: any[];
    try {
      schedule = JSON.parse(cleanedResponse);
    } catch {
      // Fallback: simple priority ordering
      schedule = calendarItems.map((item, i) => ({
        id: item.id,
        priority: i + 1,
        suggestedPublishDate: new Date(Date.now() + (i * 3 * 24 * 60 * 60 * 1000))
          .toISOString()
          .split('T')[0],
        dependencies: [],
      }));
    }

    // Merge schedule data with calendar items
    const finalCalendar = calendarItems.map(item => {
      const scheduleItem = schedule.find((s: any) => s.id === item.id);
      return {
        ...item,
        priority: scheduleItem?.priority || item.priority,
        suggestedPublishDate: scheduleItem?.suggestedPublishDate || item.suggestedPublishDate,
        dependencies: scheduleItem?.dependencies || [],
      };
    });

    // Sort by priority
    finalCalendar.sort((a, b) => a.priority - b.priority);

    console.log(`Content calendar created with ${finalCalendar.length} items`);

    return NextResponse.json({
      calendar: finalCalendar,
      summary: {
        totalItems: finalCalendar.length,
        quickWins: finalCalendar.filter(item =>
          item.estimatedEffort === 'Low' && item.estimatedImpact === 'High'
        ).length,
        highPriority: finalCalendar.filter(item => item.priority <= 5).length,
        estimatedWeeks: Math.ceil(finalCalendar.length / 2.5), // 2.5 posts per week
      },
    });
  } catch (error: any) {
    console.error('Calendar creation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create content calendar' },
      { status: 500 }
    );
  }
}
