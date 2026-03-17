import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface MultiFormatContent {
  format: string;
  content: string;
  wordCount: number;
  useCase: string;
}

export async function POST(request: NextRequest) {
  try {
    const { brief, format, location } = await request.json();

    if (!brief || !format) {
      return NextResponse.json(
        { error: 'Brief and format are required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Generating ${format} content for: ${brief.title}`);

    const locationContext = location
      ? `\n\nLocation Context: This content is for ${location}. Include relevant local references where appropriate.`
      : '';

    let prompt = '';
    let useCase = '';

    switch (format) {
      case 'faq':
        prompt = `Create an FAQ section based on this content brief:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
PAA Questions: ${brief.competitorInsights?.join(', ') || 'Not available'}
${locationContext}

Create 8-12 frequently asked questions with detailed answers.
- Questions should target long-tail keywords and voice search
- Answers should be 2-4 sentences each
- Include the target keyword naturally
- Answer questions searchers actually have
- Format for FAQ schema markup

Format as:
## Question 1
Answer...

## Question 2
Answer...`;
        useCase = 'Add to blog post, create standalone FAQ page, or use for FAQ schema';
        break;

      case 'howto':
        prompt = `Create a step-by-step How-To guide:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
Outline: ${brief.outline?.join(', ') || ''}
${locationContext}

Create a detailed how-to guide with:
- Clear introduction explaining what will be achieved
- 5-10 numbered steps
- Each step should be actionable and specific
- Include tips, warnings, or notes where relevant
- Conclude with expected results
- Format for HowTo schema markup

Use clear headings and step numbers.`;
        useCase = 'Tutorial content, instructional guides, process documentation';
        break;

      case 'listicle':
        prompt = `Create an engaging listicle article:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
${locationContext}

Create a "Top 10" or "Best X" style article with:
- Compelling introduction
- 7-12 list items
- Each item with a subheading, description (100-150 words)
- Include specific examples or data points
- Conclude with a summary or call-to-action

Make it scannable and engaging.`;
        useCase = 'High engagement content, easy to read and share';
        break;

      case 'comparison':
        prompt = `Create a comparison article:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
${locationContext}

Create a detailed comparison covering:
- Introduction to what's being compared
- Comparison criteria (features, pricing, pros/cons)
- Side-by-side analysis
- Clear winner or recommendation
- Comparison table in markdown
- Final verdict

Be objective and data-driven.`;
        useCase = 'Decision-making content, commercial intent keywords';
        break;

      case 'social-linkedin':
        prompt = `Create a LinkedIn post based on this topic:

Title: ${brief.title}
Target Keyword: ${brief.keyword}

Create a professional LinkedIn post (1300-1500 characters) that:
- Hooks readers in the first line
- Shares valuable insights or tips
- Uses short paragraphs for readability
- Includes 3-5 relevant hashtags
- Has a clear call-to-action

Professional tone, thought leadership style.`;
        useCase = 'LinkedIn content, professional social sharing';
        break;

      case 'social-twitter':
        prompt = `Create a Twitter thread (8-12 tweets) on:

Title: ${brief.title}
Target Keyword: ${brief.keyword}

Create an engaging thread with:
- Hook tweet (attention-grabbing first tweet)
- 6-10 informational tweets
- Each tweet under 280 characters
- Use line breaks for readability
- Final tweet with CTA
- Include relevant hashtags

Conversational, engaging tone.`;
        useCase = 'Twitter/X thread, social media engagement';
        break;

      case 'email':
        prompt = `Create an email newsletter on:

Title: ${brief.title}
Target Keyword: ${brief.keyword}

Create an email with:
- Compelling subject line
- Personal greeting
- Concise introduction (2-3 sentences)
- Main content (3-4 paragraphs)
- Clear call-to-action
- Sign-off

Friendly, conversational tone. Keep it scannable.`;
        useCase = 'Email marketing, newsletter content';
        break;

      case 'video-script':
        prompt = `Create a video script for:

Title: ${brief.title}
Target Keyword: ${brief.keyword}

Create a 3-5 minute video script with:
- Hook (first 10 seconds)
- Introduction
- Main points (3-5 sections with visual cues)
- Examples or demonstrations
- Conclusion and CTA
- Include [VISUAL] cues for editing

Conversational, engaging script for YouTube/TikTok.`;
        useCase = 'YouTube videos, TikTok, video content';
        break;

      case 'press-release':
        prompt = `Create a press release for:

Title: ${brief.title}
${locationContext}

Create a professional press release with:
- Strong headline
- Dateline
- Lead paragraph (who, what, when, where, why)
- Supporting paragraphs with details
- Quote from spokesperson
- Boilerplate company description
- Contact information placeholder

Professional, newsworthy tone.`;
        useCase = 'PR distribution, media outreach';
        break;

      case 'product-description':
        prompt = `Create an SEO-optimized product/service description:

Title: ${brief.title}
Target Keyword: ${brief.keyword}
${locationContext}

Create a compelling description with:
- Attention-grabbing headline
- Key features and benefits (bullets)
- Detailed description (2-3 paragraphs)
- Technical specifications or details
- Social proof or testimonials mention
- Clear call-to-action

Persuasive, benefit-focused copy.`;
        useCase = 'E-commerce, service pages, product listings';
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported format: ${format}` },
          { status: 400 }
        );
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert content writer specializing in ${format} content. Create engaging, SEO-optimized content in the specified format.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: format.startsWith('social') ? 1000 : 3000,
    });

    const content = completion.choices[0].message.content || '';
    const wordCount = content.split(/\s+/).length;

    console.log(`Generated ${format} content: ${wordCount} words`);

    return NextResponse.json({
      format: format,
      content: content,
      wordCount: wordCount,
      useCase: useCase,
      brief: brief,
      usage: {
        tokens: completion.usage?.total_tokens,
        cost: ((completion.usage?.total_tokens || 0) * 0.00003).toFixed(4),
      },
    });
  } catch (error: any) {
    console.error('Multi-format generation error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
