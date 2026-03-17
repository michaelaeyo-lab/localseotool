import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface TopicNode {
  id: string;
  topic: string;
  keyword: string;
  type: 'pillar' | 'cluster' | 'supporting';
  authorityScore: number;
  connections: string[];
  contentExists: boolean;
  recommendedWordCount: number;
}

interface AuthorityMap {
  nodes: TopicNode[];
  relationships: Array<{
    from: string;
    to: string;
    strength: number;
    type: 'parent' | 'related' | 'internal-link';
  }>;
  authorityScore: number;
  coverage: number;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { clusters, crawlData, keywords } = await request.json();

    if (!clusters || clusters.length === 0) {
      return NextResponse.json(
        { error: 'Content clusters are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Creating topical authority map for ${clusters.length} clusters`);

    const nodes: TopicNode[] = [];
    const relationships: any[] = [];
    let nodeId = 0;

    // Build nodes from clusters
    for (const cluster of clusters) {
      // Add pillar node
      const pillarId = `node-${++nodeId}`;
      const pillarExists = crawlData?.some((page: any) =>
        page.title.toLowerCase().includes(cluster.pillarKeyword.toLowerCase())
      );

      nodes.push({
        id: pillarId,
        topic: cluster.pillarTopic,
        keyword: cluster.pillarKeyword,
        type: 'pillar',
        authorityScore: 85,
        connections: [],
        contentExists: pillarExists,
        recommendedWordCount: 3000,
      });

      // Add supporting nodes
      for (const support of cluster.supportingContent) {
        const supportId = `node-${++nodeId}`;
        const supportExists = crawlData?.some((page: any) =>
          page.title.toLowerCase().includes(support.keyword.toLowerCase())
        );

        nodes.push({
          id: supportId,
          topic: support.topic,
          keyword: support.keyword,
          type: 'supporting',
          authorityScore: 60 + (support.priority <= 2 ? 15 : 0),
          connections: [pillarId],
          contentExists: supportExists,
          recommendedWordCount: 1500 + (support.priority * 200),
        });

        // Add relationship from supporting to pillar
        relationships.push({
          from: supportId,
          to: pillarId,
          strength: support.priority <= 2 ? 90 : 70,
          type: 'parent',
        });
      }
    }

    // Calculate cross-cluster relationships
    const prompt = `Analyze these content topics and identify semantic relationships:

${nodes.map((n, i) => `${i + 1}. ${n.topic} (${n.keyword}) - ${n.type}`).join('\n')}

Identify which topics should have internal links between them (beyond pillar-supporting relationships).
Look for:
- Related subtopics
- Complementary information
- Natural reading flow

Return a JSON array of relationships:
[
  {
    "fromIndex": 2,
    "toIndex": 5,
    "strength": 80,
    "reason": "Topics are related"
  }
]

Only include strong relationships (strength > 60). Return only valid JSON array.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in topical authority and content relationships. Identify semantic connections between topics. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });

    const responseText = completion.choices[0].message.content || '[]';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let crossLinks: any[] = [];
    try {
      crossLinks = JSON.parse(cleanedResponse);
    } catch {
      crossLinks = [];
    }

    // Add cross-cluster relationships
    for (const link of crossLinks) {
      if (link.fromIndex && link.toIndex && link.fromIndex <= nodes.length && link.toIndex <= nodes.length) {
        const fromNode = nodes[link.fromIndex - 1];
        const toNode = nodes[link.toIndex - 1];

        relationships.push({
          from: fromNode.id,
          to: toNode.id,
          strength: link.strength || 70,
          type: 'related',
        });

        // Update connections
        if (!fromNode.connections.includes(toNode.id)) {
          fromNode.connections.push(toNode.id);
        }
      }
    }

    // Calculate overall authority score
    const existingContent = nodes.filter(n => n.contentExists).length;
    const totalContent = nodes.length;
    const coverage = (existingContent / totalContent) * 100;

    const pillarNodes = nodes.filter(n => n.type === 'pillar');
    const existingPillars = pillarNodes.filter(n => n.contentExists).length;
    const pillarCoverage = pillarNodes.length > 0
      ? (existingPillars / pillarNodes.length) * 100
      : 0;

    const authorityScore = Math.round(
      (coverage * 0.6) + (pillarCoverage * 0.4)
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (authorityScore < 30) {
      recommendations.push('Low topical authority. Start by creating pillar content to establish expertise.');
    } else if (authorityScore < 60) {
      recommendations.push('Moderate authority. Fill content gaps and strengthen internal linking.');
    } else {
      recommendations.push('Strong authority foundation. Focus on depth and regular updates.');
    }

    if (existingPillars < pillarNodes.length) {
      recommendations.push(
        `Create ${pillarNodes.length - existingPillars} missing pillar page(s) to establish topical hubs.`
      );
    }

    const missingSupporting = nodes.filter(n => n.type === 'supporting' && !n.contentExists).length;
    if (missingSupporting > 0) {
      recommendations.push(
        `Develop ${missingSupporting} supporting articles to build comprehensive coverage.`
      );
    }

    if (relationships.filter(r => r.type === 'related').length < nodes.length * 0.3) {
      recommendations.push('Add more internal links between related topics to strengthen topical authority.');
    }

    const map: AuthorityMap = {
      nodes: nodes,
      relationships: relationships,
      authorityScore: authorityScore,
      coverage: Math.round(coverage),
      recommendations: recommendations,
    };

    console.log(`Authority map created: ${nodes.length} nodes, ${relationships.length} relationships`);

    return NextResponse.json({
      map: map,
      summary: {
        totalTopics: nodes.length,
        pillars: pillarNodes.length,
        supporting: nodes.filter(n => n.type === 'supporting').length,
        existingContent: existingContent,
        missingContent: totalContent - existingContent,
        authorityScore: authorityScore,
        coverage: Math.round(coverage),
      },
    });
  } catch (error: any) {
    console.error('Authority mapping error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create authority map' },
      { status: 500 }
    );
  }
}
