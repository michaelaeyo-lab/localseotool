import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_API_URL = 'https://serpapi.com/search';

interface SerpResult {
  keyword: string;
  topResults: Array<{
    position: number;
    title: string;
    url: string;
    snippet: string;
    domain: string;
  }>;
  paa: string[]; // People Also Ask
  relatedSearches: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { keywords, location } = await request.json();

    if (!keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Keywords are required' },
        { status: 400 }
      );
    }

    if (!SERP_API_KEY) {
      return NextResponse.json(
        { error: 'SERP API key not configured' },
        { status: 500 }
      );
    }

    console.log(`Analyzing SERP for ${keywords.length} keywords`);

    const results: SerpResult[] = [];

    for (const keyword of keywords) {
      try {
        console.log(`Fetching SERP for: ${keyword}`);

        const params: any = {
          api_key: SERP_API_KEY,
          engine: 'google',
          q: keyword,
          num: 10,
        };

        if (location) {
          params.location = location;
        }

        const response = await axios.get(SERP_API_URL, { params });
        const data = response.data;

        // Extract organic results
        const organicResults = (data.organic_results || []).slice(0, 10).map((result: any, index: number) => ({
          position: result.position || index + 1,
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          domain: extractDomain(result.link || ''),
        }));

        // Extract People Also Ask
        const paa = (data.related_questions || [])
          .slice(0, 5)
          .map((q: any) => q.question || '');

        // Extract Related Searches
        const relatedSearches = (data.related_searches || [])
          .slice(0, 8)
          .map((s: any) => s.query || '');

        results.push({
          keyword: keyword,
          topResults: organicResults,
          paa: paa,
          relatedSearches: relatedSearches,
        });

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`SERP error for keyword "${keyword}":`, error.message);
        // Continue with other keywords
        results.push({
          keyword: keyword,
          topResults: [],
          paa: [],
          relatedSearches: [],
        });
      }
    }

    console.log(`SERP analysis completed for ${results.length} keywords`);

    return NextResponse.json({
      results: results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('SERP analysis error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze SERP' },
      { status: 500 }
    );
  }
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}
