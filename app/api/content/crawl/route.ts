import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v0';

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  headings: string[];
  wordCount: number;
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    if (!FIRECRAWL_API_KEY) {
      return NextResponse.json(
        { error: 'FireCrawl API key not configured' },
        { status: 500 }
      );
    }

    console.log('Starting FireCrawl for:', url);
    console.log('API Key present:', !!FIRECRAWL_API_KEY);
    console.log('API Key preview:', FIRECRAWL_API_KEY?.substring(0, 10) + '...');

    // Step 1: Start the crawl job with retry logic for rate limits
    console.log('Sending request to FireCrawl API...');
    let crawlResponse: any = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        crawlResponse = await axios.post(
          `${FIRECRAWL_API_URL}/crawl`,
          {
            url: url,
            limit: 20,
            scrapeOptions: {
              formats: ['markdown'],
            },
          },
          {
            headers: {
              'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );
        break; // Success, exit retry loop
      } catch (err: any) {
        const isRateLimited = err.response?.data?.error?.includes('Rate limit exceeded');

        if (isRateLimited && retryCount < maxRetries) {
          const waitTime = 15000; // Wait 15 seconds
          console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry ${retryCount + 1}/${maxRetries}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
        } else {
          throw err; // Not rate limited or max retries reached
        }
      }
    }

    if (!crawlResponse) {
      throw new Error('Failed to start crawl after retries');
    }

    console.log('Crawl response received:', crawlResponse.data);
    const jobId = crawlResponse.data.jobId;

    if (!jobId) {
      console.error('No jobId in response:', crawlResponse.data);
      throw new Error('FireCrawl did not return a job ID');
    }

    console.log('FireCrawl job started:', jobId);

    // Step 2: Poll for results (max 30 attempts, 2s delay)
    let crawlData: any = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await axios.get(
        `${FIRECRAWL_API_URL}/crawl/status/${jobId}`,
        {
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          },
        }
      );

      console.log(`Poll ${i + 1}/30, status: ${statusResponse.data.status}`);

      if (statusResponse.data.status === 'completed') {
        crawlData = statusResponse.data;
        break;
      }

      if (statusResponse.data.status === 'failed') {
        throw new Error('FireCrawl job failed');
      }
    }

    if (!crawlData || !crawlData.data) {
      return NextResponse.json(
        { error: 'Crawl timeout or no data returned' },
        { status: 500 }
      );
    }

    // Step 3: Process crawl results
    const pages: CrawlResult[] = crawlData.data.map((page: any) => {
      const content = page.markdown || page.content || '';
      const headings = extractHeadings(content);
      const wordCount = content.split(/\s+/).length;

      return {
        url: page.metadata?.sourceURL || page.url || url,
        title: page.metadata?.title || 'Untitled',
        description: page.metadata?.description || '',
        headings: headings,
        wordCount: wordCount,
        content: content,
      };
    });

    console.log(`FireCrawl completed: ${pages.length} pages crawled`);

    return NextResponse.json({
      pages: pages,
      totalPages: pages.length,
    });
  } catch (error: any) {
    console.error('FireCrawl error details:');
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);

    const rawError = error.response?.data?.error || error.response?.data?.message || error.message;
    const isRateLimited = rawError?.includes?.('Rate limit exceeded');

    let errorMessage = rawError || 'Failed to crawl website';

    if (isRateLimited) {
      errorMessage = 'FireCrawl rate limit exceeded. Please wait 30 seconds and try again, or upgrade your FireCrawl plan at https://firecrawl.dev/pricing';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: isRateLimited ? 429 : 500 }
    );
  }
}

function extractHeadings(content: string): string[] {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }

  return headings;
}
