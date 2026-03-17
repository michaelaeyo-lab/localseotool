# Local SEO Auditor - Project Documentation

**Version:** 1.0.0
**Created:** March 2026
**Developer:** Michael Eyo (Built with [Claude Code](https://claude.com/claude-code))
**LinkedIn:** https://www.linkedin.com/in/asuquo-eyo-michael/

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [API Credentials & Keys](#api-credentials--keys)
3. [API Endpoints & Integration](#api-endpoints--integration)
4. [Data Flow Architecture](#data-flow-architecture)
5. [File Structure](#file-structure)
6. [Scoring System](#scoring-system)
7. [Environment Setup](#environment-setup)
8. [Deployment](#deployment)

---

## Project Overview

**Local SEO Auditor** is a professional-grade GMB (Google My Business) profile auditing tool that provides comprehensive analysis of local business listings. It combines multiple data sources to deliver accurate, actionable insights for local SEO optimization.

### Key Features:
- ✅ Real-time GMB profile analysis
- ✅ Hybrid data sourcing (Google Places API + PlePer API)
- ✅ 27-point comprehensive scoring system
- ✅ Detailed issue identification with severity levels
- ✅ Prioritized recommendations (P1/P2/P3)
- ✅ Professional dashboard UI with dark mode

### Technology Stack:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Material Symbols Outlined
- **APIs:** Google Places API, PlePer Scrape API, SERP API, Firecrawl API
- **Deployment:** Vercel

---

## API Credentials & Keys

### 1. Google Places API
**Purpose:** Search for businesses and get basic GMB data (rating, reviews, photos, hours)

- **API Key:** `AIzaSyD1-2RDqqAlO2vA4UuxO2prIYXnUu3wGb4`
- **Project:** ATCB Projects (existing)
- **Base URL:** `https://maps.googleapis.com/maps/api/place`
- **Documentation:** https://developers.google.com/maps/documentation/places/web-service

**Endpoints Used:**
```
GET /textsearch/json - Search for businesses
GET /details/json - Get detailed place information
```

**Fields Requested:**
- `place_id, name, formatted_address, formatted_phone_number`
- `website, rating, user_ratings_total, photos`
- `opening_hours, business_status, url, types`
- `editorial_summary, reviews`

**Limitations:**
- ❌ Only returns 10 photo references (not total count)
- ❌ No GMB services data
- ❌ No attributes data
- ❌ No Q&A data
- ❌ No GMB posts data
- ❌ No owner vs customer photo distinction

---

### 2. PlePer Scrape API
**Purpose:** Get comprehensive GMB data including services, attributes, Q&A, posts, and accurate photo counts

- **API Key:** `7ad3edc2f70f9152bb99b464d9170084`
- **API Signature:** `43299460abe6431c457b8fe69d4af6624957b96d`
- **Base URL:** `https://scrape.pleper.com/v3/`
- **Documentation:** https://documenter.getpostman.com/view/19586458/UzBgu9Ls
- **GitHub:** https://github.com/pleper/api

**Endpoints Used:**
```
POST /batch_add_job - Add scraping job to batch
POST /batch_commit - Execute batch jobs
GET /batch_get_results - Get results (polls until finished)
```

**Scraping Methods:**
- `google/by-profile/information` - Full listing details
- `google/by-profile/images` - All photos with metadata
- `google/by-profile/services` - Service offerings
- `google/by-profile/qa` - Questions & Answers
- `google/by-profile/posts` - GMB posts with dates

**Profile URL Formats:**
```
https://maps.google.com/?cid={{CID}}
https://search.google.com/local/reviews?placeid={{PLACE_ID}}
```

**Request Flow:**
1. Create batch (use `batch_id: "new"`)
2. Add jobs to batch (returns `batch_id` and `job_id`)
3. Commit batch
4. Poll for results (max 10 attempts, 2s delay)
5. Parse results by job_id

**Data Provided:**
- ✅ Accurate total photo count
- ✅ Owner vs customer photo breakdown
- ✅ Logo and cover photo detection
- ✅ Video count
- ✅ Service listings with descriptions
- ✅ Business attributes (12+ attributes)
- ✅ Q&A section
- ✅ GMB posts with date tracking
- ✅ Posts in last 30 days

---

### 3. SERP API
**Purpose:** Reserved for SERP position tracking (not currently implemented)

- **API Key:** `698b4f4766e116d69135b357d55921bffdfc4c18ee1841e9a0397c7843b875d6`
- **Base URL:** https://serpapi.com/
- **Status:** Available but not integrated yet

**Potential Use Cases:**
- Track local pack rankings
- Monitor competitor positions
- Analyze SERP features

---

### 4. Firecrawl API
**Purpose:** Web scraping and content analysis (not currently implemented)

- **API Key:** `fc-4fe7772e718a4216bca5f5b19adfefe6`
- **Base URL:** https://api.firecrawl.dev/
- **Status:** Available but not integrated yet

**Potential Use Cases:**
- Website content analysis
- Competitor website auditing
- On-page SEO analysis

---

## API Endpoints & Integration

### Frontend Endpoints

#### `POST /api/audit`
**Purpose:** Main audit endpoint that searches for businesses and returns comprehensive analysis

**Request Body:**
```json
{
  "businessName": "Aboki Gadgets Hub",
  "location": "Ikeja, Lagos, Nigeria"
}
```

**Response:**
```json
{
  "results": [
    {
      "businessName": "Aboki Gadgets Hub, Ikeja",
      "address": "Suite 201, Divine Plaza...",
      "rating": 4.4,
      "totalReviews": 52,
      "website": "http://www.abokigadgets.com/",
      "phone": "09052986007",
      "priorityScore": 35,
      "priorityStatus": "medium",
      "completenessScore": 78,
      "issues": [
        {
          "title": "Insufficient Visual Content",
          "description": "31 photos. Competitive profiles have 50+ photos...",
          "severity": "warning",
          "points": 10
        }
      ],
      "recommendations": [
        {
          "title": "Expand Photo Gallery",
          "description": "Add product photos, team photos...",
          "priority": "P2",
          "impact": "Medium"
        }
      ],
      "googleMapsUrl": "https://maps.google.com/?cid=..."
    }
  ],
  "count": 1
}
```

**Error Responses:**
- `400` - Missing required fields (businessName or location)
- `404` - No businesses found
- `500` - API error or processing failure

---

## Data Flow Architecture

### Complete Audit Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│  (Next.js Frontend - app/page.tsx)                         │
│                                                              │
│  [Business Name Input] [Location Input] [Audit Button]     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTE: /api/audit/route.ts                 │
│                                                              │
│  Step 1: Search Businesses                                  │
│          ▼                                                   │
│  ┌────────────────────────────┐                             │
│  │  Google Places API         │                             │
│  │  /textsearch/json          │                             │
│  │  Returns: place_id, name   │                             │
│  └────────────────────────────┘                             │
│          │                                                   │
│          ▼                                                   │
│  Step 2: Get Basic Details (Google Places)                  │
│          ▼                                                   │
│  ┌────────────────────────────┐                             │
│  │  Google Places API         │                             │
│  │  /details/json             │                             │
│  │  Returns: Basic GMB data   │                             │
│  └────────────────────────────┘                             │
│          │                                                   │
│          ▼                                                   │
│  Step 3: Get Enhanced Data (PlePer)                         │
│          ▼                                                   │
│  ┌────────────────────────────────────────────────────┐     │
│  │  PlePer API (lib/pleper.ts)                        │     │
│  │                                                      │     │
│  │  1. Create Batch (batch_id: "new")                 │     │
│  │  2. Add 5 Jobs:                                    │     │
│  │     - google/by-profile/information                │     │
│  │     - google/by-profile/images                     │     │
│  │     - google/by-profile/services                   │     │
│  │     - google/by-profile/qa                         │     │
│  │     - google/by-profile/posts                      │     │
│  │  3. Commit Batch                                   │     │
│  │  4. Poll Results (max 10 attempts)                 │     │
│  │  5. Parse & Return Enhanced Data                   │     │
│  └────────────────────────────────────────────────────┘     │
│          │                                                   │
│          ▼                                                   │
│  Step 4: Merge Data                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Combine:                                          │     │
│  │  - Google Places basic data                        │     │
│  │  - PlePer enhanced data                            │     │
│  │  Into: BusinessData interface                      │     │
│  └────────────────────────────────────────────────────┘     │
│          │                                                   │
│          ▼                                                   │
│  Step 5: Calculate Score                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  lib/scoring.ts                                    │     │
│  │  - Run 27 audit checks                             │     │
│  │  - Calculate priority score (0-100)                │     │
│  │  - Generate issues list                            │     │
│  │  - Generate recommendations                        │     │
│  │  - Calculate completeness %                        │     │
│  └────────────────────────────────────────────────────┘     │
│          │                                                   │
│          ▼                                                   │
│  Step 6: Return Results                                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND DISPLAY                           │
│  - Priority score badge (color-coded)                       │
│  - Stats grid (score, rating, reviews, completeness)       │
│  - Issues list (with severity badges)                       │
│  - Recommendations (with priority/impact tags)              │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
local-seo-auditor/
├── app/
│   ├── api/
│   │   └── audit/
│   │       └── route.ts          # Main audit API endpoint
│   ├── globals.css               # Global styles + Material icons
│   ├── layout.tsx                # Root layout with Material fonts
│   └── page.tsx                  # Main dashboard UI
├── lib/
│   ├── google-places.ts          # Google Places API integration
│   ├── pleper.ts                 # PlePer Scrape API integration
│   └── scoring.ts                # 27-point scoring algorithm
├── .env.local                    # API keys (DO NOT COMMIT)
├── tailwind.config.js            # Tailwind configuration
├── package.json                  # Dependencies
├── PROJECT.md                    # This file
└── tsconfig.json                 # TypeScript configuration
```

---

## Scoring System

### BusinessData Interface
```typescript
interface BusinessData {
  // Core Fields (Google Places)
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  website?: string;
  phone?: string;
  photosCount: number;
  hasHours: boolean;
  operational: boolean;
  types?: string[];

  // Enhanced Fields (PlePer)
  hasDescription?: boolean;
  descriptionLength?: number;
  hasAttributes?: boolean;
  attributesCount?: number;
  hasServices?: boolean;
  servicesCount?: number;
  hasQuestionsAndAnswers?: boolean;
  qaCount?: number;
  hasRecentPosts?: boolean;
  postsLast30Days?: number;
  ownerPhotoCount?: number;
  customerPhotoCount?: number;
  videoCount?: number;
  hasLogo?: boolean;
  hasCoverPhoto?: boolean;
  reviewResponseRate?: number;
  averageResponseTime?: number;
}
```

### 27 Audit Checks

| # | Check | Points | Severity | Source |
|---|-------|--------|----------|--------|
| 1 | No Website | 20 | Critical | Google Places |
| 2 | No Phone | 15 | Critical | Google Places |
| 3 | Very Low Reviews (<5) | 15 | Critical | Google Places |
| 4 | Low Reviews (5-20) | 10 | Warning | Google Places |
| 5 | Poor Rating (<3.5) | 15 | Critical | Google Places |
| 6 | Low Rating (3.5-4.0) | 8 | Warning | Google Places |
| 7 | No Rating | 10 | Critical | Google Places |
| 8 | Very Few Photos (<5) | 15 | Critical | PlePer |
| 9 | Few Photos (5-15) | 10 | Warning | PlePer |
| 10 | No Business Hours | 10 | Critical | Google Places |
| 11 | Not Operational | 20 | Critical | Google Places |
| 12 | No Description | 12 | Critical | PlePer |
| 13 | No GMB Posts | 15 | Critical | PlePer |
| 14 | Infrequent Posts (1-4/month) | 8 | Warning | PlePer |
| 15 | No Recent Posts (>7 days) | 10 | Warning | PlePer |
| 16 | No Owner Photos | 12 | Critical | PlePer |
| 17 | Low Owner Photo Ratio (<60%) | 8 | Warning | PlePer |
| 18 | No Videos | 10 | Warning | PlePer |
| 19 | Missing Logo/Cover | 8 | Critical | PlePer |
| 20 | No Q&A | 8 | Warning | PlePer |
| 21 | Few Q&A (1-5) | 5 | Info | PlePer |
| 22 | No Services | 10 | Critical | PlePer |
| 23 | Few Services (1-5) | 6 | Warning | PlePer |
| 24 | No Attributes | 8 | Warning | PlePer |
| 25 | Poor Review Response (<50%) | 12 | Critical | Future |
| 26 | Moderate Response (50-80%) | 6 | Warning | Future |
| 27 | Incomplete Profile (<50%) | 15 | Critical | Combined |

### Scoring Logic

**Priority Score:** 0-100 (lower is better)
- **0-29 points** = LOW priority (Well optimized) ✅
- **30-59 points** = MEDIUM priority (Needs improvement) ⚠️
- **60-100 points** = HIGH priority (Urgent action required) ❌

**Completeness Score:** 0-100% (higher is better)
- Calculated from 25 criteria
- 80%+ = Excellent
- 50-79% = Good
- <50% = Needs work

---

## Environment Setup

### 1. Install Dependencies
```bash
cd C:\Users\Michael Eyo\seo-tools\local-seo-auditor
npm install
```

### 2. Configure Environment Variables
Create `.env.local` file:
```env
# Google Places API
GOOGLE_PLACES_API_KEY=AIzaSyD1-2RDqqAlO2vA4UuxO2prIYXnUu3wGb4

# SERP API
SERP_API_KEY=698b4f4766e116d69135b357d55921bffdfc4c18ee1841e9a0397c7843b875d6

# Firecrawl API
FIRECRAWL_API_KEY=fc-4fe7772e718a4216bca5f5b19adfefe6

# PlePer API
PLEPER_API_KEY=7ad3edc2f70f9152bb99b464d9170084
PLEPER_API_SIGNATURE=43299460abe6431c457b8fe69d4af6624957b96d
```

### 3. Run Development Server
```bash
npm run dev
```

Access at: **http://localhost:3010**

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push to GitHub
   - Import to Vercel

2. **Configure Environment Variables**
   - Add all API keys from `.env.local`
   - Set in Vercel Dashboard → Settings → Environment Variables

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Environment Variables Required:
- ✅ `GOOGLE_PLACES_API_KEY`
- ✅ `PLEPER_API_KEY`
- ✅ `PLEPER_API_SIGNATURE`
- ⚠️ `SERP_API_KEY` (optional)
- ⚠️ `FIRECRAWL_API_KEY` (optional)

### Build Settings:
- **Framework:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node Version:** 18.x or higher

---

## API Usage Limits & Costs

### Google Places API
- **Free Tier:** $200/month credit
- **Cost:** $0.017 per request (Text Search) + $0.017 per request (Place Details)
- **Monthly Free:** ~5,882 requests
- **Our Usage:** ~2 requests per audit

### PlePer API
- **Pricing:** Check https://pleper.com/index.php?do=prices
- **Current Plan:** API access enabled
- **Our Usage:** 5 requests per audit (batched)

### Recommendations:
- Cache audit results for 24 hours
- Implement rate limiting
- Add pagination for bulk audits
- Monitor API usage in dashboard

---

## Future Enhancements

### Planned Features:
1. **Review Response Rate** - Calculate from review data
2. **Competitor Analysis** - Compare with nearby businesses
3. **Historical Tracking** - Track score changes over time
4. **PDF Reports** - Generate downloadable audit reports
5. **Bulk Audits** - Process multiple businesses at once
6. **SERP Tracking** - Monitor local pack rankings
7. **Website Analysis** - Integrate Firecrawl for on-page SEO
8. **GMB Posts Suggestions** - AI-generated post ideas
9. **Review Management** - Track and respond to reviews
10. **White Label** - Custom branding for agencies

---

## Troubleshooting

### Common Issues:

**1. PlePer API Timeout**
- **Cause:** Batch taking longer than expected
- **Solution:** Increase `maxAttempts` in `getBatchResults()`

**2. Google Places returning 10 photos**
- **Expected:** This is API limitation
- **Solution:** PlePer API provides accurate count

**3. "No Services Listed" error**
- **Cause:** PlePer API couldn't access services
- **Check:** Profile URL format is correct

**4. Port 3010 already in use**
- **Solution:** Kill existing process or use different port
```bash
netstat -ano | findstr :3010
taskkill /PID <PID> /F
```

**5. API Key errors**
- **Check:** Environment variables are loaded
- **Verify:** `.env.local` file exists and has correct keys
- **Restart:** Development server after adding new keys

---

## Credits & Attribution

**Developer:** Michael Eyo
**LinkedIn:** https://www.linkedin.com/in/asuquo-eyo-michael/
**Built with:** [Claude Code](https://claude.com/claude-code) - AI-powered development assistant
**GitHub:** (Add your GitHub URL)

**APIs & Services:**
- Google Places API (Google LLC)
- PlePer Scrape API (PlePer.com)
- SERP API (SerpApi LLC)
- Firecrawl API (Firecrawl.dev)

**UI/UX:**
- Designed with Google Stitch
- Material Symbols Icons (Google)
- Tailwind CSS
- Next.js 14

---

**Last Updated:** March 17, 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
