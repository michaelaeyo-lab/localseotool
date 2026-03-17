import { NextRequest, NextResponse } from 'next/server';
import { searchBusiness, getPlaceDetails } from '@/lib/google-places';
import { calculatePriorityScore, BusinessData } from '@/lib/scoring';
import { getEnhancedGMBData, buildProfileUrl } from '@/lib/pleper';

export async function POST(request: NextRequest) {
  try {
    const { businessName, location } = await request.json();

    if (!businessName || !location) {
      return NextResponse.json(
        { error: 'Business name and location are required' },
        { status: 400 }
      );
    }

    // Step 1: Search for businesses
    const searchResults = await searchBusiness(businessName, location);

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: 'No businesses found matching your search' },
        { status: 404 }
      );
    }

    // Step 2: Get detailed information for top results (limit to 3)
    const topResults = searchResults.slice(0, 3);
    const auditResults = [];

    for (const result of topResults) {
      try {
        const details = await getPlaceDetails(result.place_id);

        // Try to get enhanced data from PlePer API
        let enhancedData;
        try {
          // Build profile URL from Google Maps URL or place_id
          const profileUrl = buildProfileUrl(details.url, result.place_id);
          if (profileUrl) {
            console.log('Fetching PlePer data for:', profileUrl);
            enhancedData = await getEnhancedGMBData(profileUrl);
            console.log('Enhanced data received:', JSON.stringify(enhancedData, null, 2));
          } else {
            console.log('Could not build profile URL from:', details.url);
          }
        } catch (pleperError) {
          console.error('PlePer API error, using Google Places data only:', pleperError);
          // Continue with Google Places data only
        }

        // Prepare business data for scoring (merge Google Places + PlePer data)
        const businessData: BusinessData = {
          name: details.name,
          address: details.formatted_address,
          rating: details.rating || 0,
          totalReviews: details.user_ratings_total || 0,
          website: details.website,
          phone: details.formatted_phone_number,
          photosCount: enhancedData?.images?.total_count || details.photos?.length || 0,
          hasHours: !!details.opening_hours?.weekday_text,
          operational: details.business_status === 'OPERATIONAL',
          types: details.types || [],

          // Enhanced fields from PlePer API
          hasDescription: !!details.editorial_summary?.overview || !!enhancedData?.listingInfo,
          descriptionLength: details.editorial_summary?.overview?.length || 0,

          // Services data from PlePer
          hasServices: enhancedData?.services ? enhancedData.services.count > 0 : undefined,
          servicesCount: enhancedData?.services?.count,

          // Attributes from PlePer
          hasAttributes: enhancedData?.attributes ? enhancedData.attributes.count > 0 : undefined,
          attributesCount: enhancedData?.attributes?.count,

          // Q&A from PlePer
          hasQuestionsAndAnswers: enhancedData?.qa ? enhancedData.qa.count > 0 : undefined,
          qaCount: enhancedData?.qa?.count,

          // Posts from PlePer
          hasRecentPosts: enhancedData?.posts ? enhancedData.posts.posts_last_30_days > 0 : undefined,
          postsLast30Days: enhancedData?.posts?.posts_last_30_days,

          // Photo details from PlePer
          ownerPhotoCount: enhancedData?.images?.owner_count,
          customerPhotoCount: enhancedData?.images?.customer_count,
          videoCount: enhancedData?.images?.videos_count,
          hasLogo: enhancedData?.images?.has_logo,
          hasCoverPhoto: enhancedData?.images?.has_cover,

          // Review response rate (TODO: calculate from reviews)
          reviewResponseRate: undefined,
          averageResponseTime: undefined,
        };

        // Calculate priority score
        const scoring = calculatePriorityScore(businessData);

        auditResults.push({
          businessName: details.name,
          address: details.formatted_address,
          rating: details.rating || 0,
          totalReviews: details.user_ratings_total || 0,
          website: details.website,
          phone: details.formatted_phone_number,
          priorityScore: scoring.priorityScore,
          priorityStatus: scoring.priorityStatus,
          completenessScore: scoring.completenessScore,
          issues: scoring.issues,
          recommendations: scoring.recommendations,
          googleMapsUrl: details.url,
        });
      } catch (error) {
        console.error(`Error processing place ${result.place_id}:`, error);
        // Continue with other results
      }
    }

    if (auditResults.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve business details' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      results: auditResults,
      count: auditResults.length,
    });
  } catch (error: any) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
