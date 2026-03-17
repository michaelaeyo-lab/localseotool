# Local SEO Auditor

Professional Google My Business (GMB) profile auditing and optimization tool.

## Features

- 🔍 **Business Search** - Find GMB profiles by business name and location
- 📊 **Priority Scoring** - 0-100 score based on optimization opportunities
- ⚠️ **Issue Detection** - Identifies missing elements and weak points
- ✅ **Recommendations** - Actionable optimization steps
- 🎯 **Multi-Business Results** - Shows top 3 matching businesses

## How It Works

1. **Search**: Enter business name and location
2. **Discover**: Finds matching GMB profiles via Google Places API
3. **Audit**: Analyzes profile completeness, reviews, ratings, photos
4. **Score**: Calculates priority score (0-100)
5. **Recommend**: Provides specific optimization actions

## Priority Scoring

### Scoring Factors (100 points total):
- Low review count (<20): 15 points
- Low review velocity (<30): 15 points
- Poor rating (<4.0): 10 points
- Few photos (<10): 10 points
- No website: 10 points
- Incomplete GMB (<50%): 10 points
- Not operational: 10 points
- No business hours: 5 points
- No phone number: 5 points

### Priority Levels:
- 🔴 **High (80-100)**: Critical optimization needed
- 🟡 **Medium (60-79)**: Moderate improvements possible
- 🟢 **Low (0-59)**: Well-optimized profile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: Google Places API
- **Deployment**: Vercel

## Environment Variables

Create `.env.local` file:

```env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

## Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## API Endpoints

### POST /api/audit

Search and audit GMB profiles.

**Request:**
```json
{
  "businessName": "Joe's Pizza",
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "results": [
    {
      "businessName": "Joe's Pizza",
      "address": "7 Carmine St, New York, NY 10014",
      "rating": 4.5,
      "totalReviews": 1234,
      "website": "https://example.com",
      "phone": "+1 212-555-0123",
      "priorityScore": 45,
      "priorityStatus": "low",
      "issues": ["Only 12 photos - needs visual content"],
      "recommendations": ["Add high-quality photos"],
      "googleMapsUrl": "https://maps.google.com/..."
    }
  ],
  "count": 1
}
```

## License

Proprietary - Michael Asuquo-Eyo

## Support

For issues or questions, contact the developer.
