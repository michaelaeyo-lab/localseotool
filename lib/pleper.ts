import axios from 'axios';
import crypto from 'crypto';

const PLEPER_API_KEY = process.env.PLEPER_API_KEY || '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SECRET = process.env.PLEPER_API_SIGNATURE || '43299460abe6431c457b8fe69d4af6624957b96d';
const PLEPER_API_BASE = 'https://scrape.pleper.com/v3';

interface PleperJobResponse {
  success: number;
  job_id?: string;
  batch_id?: string;
  queries_left?: number;
  http_code_status?: number;
}

interface PleperBatchResult {
  success: number;
  status?: string;
  http_code_status?: number;
  results?: {
    [method: string]: Array<{
      job_id: string;
      status: string;
      payload?: any;
      results?: any;
    }>;
  };
}

export interface PleperEnhancedData {
  listingInfo?: any;
  images?: {
    total_count: number;
    owner_count: number;
    customer_count: number;
    has_logo: boolean;
    has_cover: boolean;
    videos_count: number;
  };
  reviews?: any[];
  services?: {
    count: number;
  };
  attributes?: {
    count: number;
  };
  qa?: {
    count: number;
  };
  posts?: {
    posts_last_30_days: number;
  };
}

/**
 * Calculate HMAC signature for PlePer Scrape API
 */
function calculateSignature(params: any): string {
  // Sort params by key in reverse order (krsort in PHP)
  const sortedKeys = Object.keys(params).sort().reverse();
  const sortedParams: any = {};
  sortedKeys.forEach(key => {
    sortedParams[key] = params[key];
  });

  // Create signature string: apiKey + json_encode(params)
  const signatureString = PLEPER_API_KEY + JSON.stringify(sortedParams);

  // Calculate HMAC-SHA1
  const signature = crypto
    .createHmac('sha1', PLEPER_API_SECRET)
    .update(signatureString)
    .digest('hex');

  return signature;
}

/**
 * Make PlePer Scrape API call
 */
async function callApi(
  method: string,
  params: any = {}
): Promise<any> {
  try {
    // Calculate signature
    const signature = calculateSignature(params);

    // Add API credentials
    const requestParams = {
      api_key: PLEPER_API_KEY,
      api_sig: signature,
      ...params,
    };

    console.log(`PlePer API call: ${method}`);

    const response = await axios.post(
      `${PLEPER_API_BASE}${method}`,
      new URLSearchParams(requestParams as any).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`PlePer API error (${method}):`, error.message);
    console.error('Error response:', error.response?.data);
    throw new Error(`PlePer API call failed: ${method}`);
  }
}

/**
 * Commit batch to start processing
 */
async function batchCommit(batchId: string): Promise<void> {
  const result = await callApi('/batch_commit', { batch_id: batchId });
  if (!result.success) {
    throw new Error('Failed to commit PlePer batch');
  }
}

/**
 * Get batch results
 */
async function batchGetResults(batchId: string): Promise<PleperBatchResult> {
  try {
    // batch_get_results uses GET method
    const params = { batch_id: batchId };
    const signature = calculateSignature(params);

    const response = await axios.get(`${PLEPER_API_BASE}/batch_get_results`, {
      params: {
        api_key: PLEPER_API_KEY,
        api_sig: signature,
        batch_id: batchId,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('PlePer batch_get_results error:', error.message);
    throw new Error('Failed to get PlePer batch results');
  }
}

/**
 * Get comprehensive GMB data from PlePer Scrape API
 */
export async function getEnhancedGMBData(profileUrl: string): Promise<PleperEnhancedData> {
  try {
    console.log('PlePer: Starting enhanced data fetch for:', profileUrl);

    const jobIds: { [key: string]: string } = {};

    // Add job for listing information
    const infoResult = await callApi('/google/by-profile/information', {
      batch_id: 'new',
      profile_url: profileUrl,
    });

    if (!infoResult.success) {
      throw new Error('Failed to add information job');
    }

    const batchId = infoResult.batch_id;
    jobIds['info'] = infoResult.job_id;
    console.log('PlePer: Created batch:', batchId, 'Job ID:', infoResult.job_id);

    // Add job for images
    const imagesResult = await callApi('/google/by-profile/images', {
      batch_id: batchId,
      profile_url: profileUrl,
    });

    if (imagesResult.success) {
      jobIds['images'] = imagesResult.job_id;
      console.log('PlePer: Added images job:', imagesResult.job_id);
    }

    // Add job for reviews
    const reviewsResult = await callApi('/google/by-profile/reviews', {
      batch_id: batchId,
      profile_url: profileUrl,
    });

    if (reviewsResult.success) {
      jobIds['reviews'] = reviewsResult.job_id;
      console.log('PlePer: Added reviews job:', reviewsResult.job_id);
    }

    // Commit batch
    await batchCommit(batchId);
    console.log('PlePer: Batch committed, waiting for results...');

    // Poll for results (max 20 attempts, 5s delay)
    let results: PleperBatchResult | null = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      results = await batchGetResults(batchId);

      console.log(`PlePer: Poll ${i + 1}/20, status: ${results.status}`);

      if (results.status === 'Finished') {
        console.log('PlePer: Batch finished!');
        break;
      }
    }

    if (!results || !results.results) {
      console.error('PlePer: No results in batch response');
      throw new Error('PlePer batch timeout or no results');
    }

    console.log('PlePer: Full batch results:', JSON.stringify(results, null, 2));

    // Parse results (keys don't have leading slashes)
    const enhancedData: PleperEnhancedData = {};

    // Get information results
    const infoKey = 'google/by-profile/information';
    if (results.results[infoKey] && Array.isArray(results.results[infoKey])) {
      const infoJob = results.results[infoKey][0];
      if (infoJob && infoJob.results) {
        enhancedData.listingInfo = infoJob.results;
        console.log('PlePer: Got listing info, image_count:', infoJob.results.image_count);

        // Extract image count from listing info
        if (infoJob.results.image_count) {
          enhancedData.images = {
            total_count: infoJob.results.image_count,
            owner_count: 0,
            customer_count: 0,
            has_logo: false,
            has_cover: false,
            videos_count: 0,
          };
          console.log('PlePer: Set image count to:', infoJob.results.image_count);
        }
      }
    }

    // Get images results (additional image details if needed)
    const imagesKey = 'google/by-profile/images';
    if (results.results[imagesKey] && Array.isArray(results.results[imagesKey])) {
      const imagesJob = results.results[imagesKey][0];
      if (imagesJob && imagesJob.results && !enhancedData.images) {
        console.log('PlePer: Got images from images endpoint');
        enhancedData.images = parseImagesData(imagesJob.results);
      }
    }

    // Get reviews results
    const reviewsKey = 'google/by-profile/reviews';
    if (results.results[reviewsKey] && Array.isArray(results.results[reviewsKey])) {
      const reviewsJob = results.results[reviewsKey][0];
      if (reviewsJob && reviewsJob.results) {
        enhancedData.reviews = reviewsJob.results.reviews || [];
        console.log('PlePer: Got reviews, count:', enhancedData.reviews.length);
      }
    }

    console.log('PlePer: Enhanced data retrieved successfully');
    return enhancedData;
  } catch (error: any) {
    console.error('PlePer enhanced data error:', error.message);
    throw error;
  }
}

/**
 * Parse images data
 */
function parseImagesData(payload: any): PleperEnhancedData['images'] {
  // The images endpoint returns an array of image objects
  const images = payload.images || [];
  const imageCount = Array.isArray(images) ? images.length : (payload.total || payload.count || 0);

  return {
    total_count: imageCount,
    owner_count: 0, // Not easily distinguishable in v3 API
    customer_count: 0,
    has_logo: false,
    has_cover: false,
    videos_count: 0,
  };
}

/**
 * Build profile URL from CID or place_id
 */
export function buildProfileUrl(googleMapsUrl?: string, placeId?: string, cid?: string): string | null {
  if (googleMapsUrl && googleMapsUrl.includes('cid=')) {
    return googleMapsUrl;
  }
  if (cid) {
    return `https://maps.google.com/?cid=${cid}`;
  }
  if (placeId) {
    return `https://search.google.com/local/reviews?placeid=${placeId}`;
  }
  return null;
}

/**
 * Extract CID from Google Maps URL
 */
export function extractCID(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/cid=(\d+)/);
  return match ? match[1] : null;
}
