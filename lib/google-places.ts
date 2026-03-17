import axios from 'axios';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating: number;
  user_ratings_total: number;
  photos?: any[];
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  business_status?: string;
  url: string;
  types?: string[]; // Business categories
  editorial_summary?: {
    overview?: string;
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export async function searchBusiness(
  businessName: string,
  location: string
): Promise<PlaceSearchResult[]> {
  try {
    const query = `${businessName} ${location}`;
    const response = await axios.get(
      `${PLACES_API_BASE}/textsearch/json`,
      {
        params: {
          query,
          key: GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.results || [];
  } catch (error: any) {
    console.error('Error searching business:', error.message);
    throw new Error('Failed to search for business');
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  try {
    const response = await axios.get(
      `${PLACES_API_BASE}/details/json`,
      {
        params: {
          place_id: placeId,
          fields: 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,business_status,url,types,editorial_summary,reviews',
          key: GOOGLE_PLACES_API_KEY,
        },
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Google Places API error: ${response.data.status}`);
    }

    return response.data.result;
  } catch (error: any) {
    console.error('Error getting place details:', error.message);
    throw new Error('Failed to get place details');
  }
}
