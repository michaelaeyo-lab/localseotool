// Comprehensive GMB Priority Scoring System
// Lower score = Better optimization (0 = Perfect, 100 = Needs Major Work)

export interface BusinessData {
  name: string;
  address: string;
  rating: number;
  totalReviews: number;
  website?: string;
  phone?: string;
  photosCount: number;
  hasHours: boolean;
  operational: boolean;
  types?: string[]; // Business categories
  // Enhanced audit fields
  hasDescription?: boolean;
  descriptionLength?: number;
  hasAttributes?: boolean;
  attributesCount?: number;
  hasServices?: boolean;
  servicesCount?: number;
  hasQuestionsAndAnswers?: boolean;
  qaCount?: number;
  hasRecentPosts?: boolean; // Posts within last 7 days
  postsLast30Days?: number;
  ownerPhotoCount?: number; // Photos uploaded by owner vs customer
  customerPhotoCount?: number;
  videoCount?: number;
  hasLogo?: boolean;
  hasCoverPhoto?: boolean;
  reviewResponseRate?: number; // Percentage of reviews responded to
  averageResponseTime?: number; // Hours to respond
}

export interface ScoringResult {
  priorityScore: number;
  priorityStatus: 'high' | 'medium' | 'low';
  issues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    points: number;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'P1' | 'P2' | 'P3';
    impact: 'High' | 'Medium' | 'Low';
  }>;
  completenessScore: number;
}

export function calculatePriorityScore(business: BusinessData): ScoringResult {
  let score = 0;
  const issues: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    points: number;
  }> = [];
  const recommendations: Array<{
    title: string;
    description: string;
    priority: 'P1' | 'P2' | 'P3';
    impact: 'High' | 'Medium' | 'Low';
  }> = [];

  // CRITICAL ISSUES (High Impact)

  // 1. No Website (20 points)
  if (!business.website) {
    score += 20;
    issues.push({
      title: 'No Website Listed',
      description: 'Missing website URL severely limits customer trust and conversion potential. 75% of users check website before visiting.',
      severity: 'critical',
      points: 20,
    });
    recommendations.push({
      title: 'Add Professional Website',
      description: 'Create or link existing website to GMB profile. Include service pages, contact info, and clear CTAs.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 2. No Phone Number (15 points)
  if (!business.phone) {
    score += 15;
    issues.push({
      title: 'No Phone Number',
      description: 'Customers cannot call directly from GMB. Critical for local service businesses.',
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Add Verified Phone Number',
      description: 'Add and verify primary business phone number. Enable click-to-call functionality.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 3. Very Low Reviews (<5 reviews) (15 points)
  if (business.totalReviews < 5) {
    score += 15;
    issues.push({
      title: 'Critical Review Deficit',
      description: `Only ${business.totalReviews} reviews. Minimum 20 reviews needed for credibility. 88% of consumers read reviews before visiting.`,
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Launch Review Generation Campaign',
      description: 'Implement automated post-service review requests via SMS/email. Target 5 reviews per week for next 4 weeks.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 4. Low Reviews (5-20 reviews) (10 points)
  else if (business.totalReviews < 20) {
    score += 10;
    issues.push({
      title: 'Insufficient Review Volume',
      description: `${business.totalReviews} reviews. Need minimum 20-50 for competitive visibility.`,
      severity: 'warning',
      points: 10,
    });
    recommendations.push({
      title: 'Scale Review Generation',
      description: 'Set up automated review request workflow. Add QR codes at checkout, email follow-ups, and staff incentives.',
      priority: 'P2',
      impact: 'High',
    });
  }

  // 5. Poor Rating (<3.5 stars) (15 points)
  if (business.rating > 0 && business.rating < 3.5) {
    score += 15;
    issues.push({
      title: 'Poor Star Rating',
      description: `${business.rating.toFixed(1)} stars is below competitive threshold. 3.5+ stars required for local pack visibility.`,
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Review Management & Service Improvement',
      description: 'Respond to all negative reviews professionally. Address service quality issues. Encourage satisfied customers to leave reviews.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 6. Low Rating (3.5-4.0 stars) (8 points)
  else if (business.rating > 0 && business.rating < 4.0) {
    score += 8;
    issues.push({
      title: 'Below-Average Rating',
      description: `${business.rating.toFixed(1)} stars. Competitive profiles have 4.2+ average rating.`,
      severity: 'warning',
      points: 8,
    });
    recommendations.push({
      title: 'Improve Rating to 4.0+',
      description: 'Focus on customer experience improvements. Respond to all reviews within 24 hours. Implement feedback loop.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 7. No Rating (10 points)
  else if (business.rating === 0) {
    score += 10;
    issues.push({
      title: 'No Reviews or Rating',
      description: 'Zero reviews indicates new listing or inactive profile. Urgently need social proof.',
      severity: 'critical',
      points: 10,
    });
    recommendations.push({
      title: 'Get First 10 Reviews',
      description: 'Manually request reviews from recent customers. Offer incentive for first reviewers (comply with Google policies).',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 8. Very Few Photos (<5) (15 points)
  if (business.photosCount < 5) {
    score += 15;
    issues.push({
      title: 'Critical Photo Shortage',
      description: `Only ${business.photosCount} photos. Businesses with 100+ photos get 520% more calls. Minimum 20 photos recommended.`,
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Upload High-Quality Photos',
      description: 'Add: Storefront exterior, interior, products/services, team, logo, cover photo. Minimum 20 photos total.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 9. Few Photos (5-15) (10 points)
  else if (business.photosCount < 15) {
    score += 10;
    issues.push({
      title: 'Insufficient Visual Content',
      description: `${business.photosCount} photos. Competitive profiles have 50+ photos for maximum engagement.`,
      severity: 'warning',
      points: 10,
    });
    recommendations.push({
      title: 'Expand Photo Gallery',
      description: 'Add product photos, team photos, before/after, seasonal updates. Target 50+ total photos.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 10. No Business Hours (10 points)
  if (!business.hasHours) {
    score += 10;
    issues.push({
      title: 'Business Hours Missing',
      description: 'No hours listed reduces customer trust and prevents "Open Now" badge visibility.',
      severity: 'critical',
      points: 10,
    });
    recommendations.push({
      title: 'Add Complete Business Hours',
      description: 'Set hours for all 7 days. Include special hours for holidays. Enable real-time updates.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 11. Not Operational (20 points)
  if (!business.operational) {
    score += 20;
    issues.push({
      title: 'Marked as Closed',
      description: 'Profile shows as temporarily or permanently closed. This kills all visibility.',
      severity: 'critical',
      points: 20,
    });
    recommendations.push({
      title: 'Update Operational Status',
      description: 'If business is active, immediately update status to "Open". Verify with Google Support if needed.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 12. No Business Description (12 points)
  if (!business.hasDescription || (business.descriptionLength && business.descriptionLength < 100)) {
    score += 12;
    issues.push({
      title: 'Missing or Inadequate Business Description',
      description: business.hasDescription
        ? `Description too short (${business.descriptionLength} chars). Use full 750 characters to improve relevance signals.`
        : 'No business description. This is critical for keyword targeting and helping customers understand your services.',
      severity: 'critical',
      points: 12,
    });
    recommendations.push({
      title: 'Write Comprehensive Business Description',
      description: 'Create 750-character description with primary keywords, services offered, service area, and unique value proposition. Front-load important keywords.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 13. No GMB Posts (15 points)
  if (business.postsLast30Days !== undefined && business.postsLast30Days === 0) {
    score += 15;
    issues.push({
      title: 'Zero GMB Posts',
      description: 'No Google Posts in last 30 days. Regular posting increases engagement by 36% and improves local pack rankings.',
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Start Weekly Google Posts',
      description: 'Post 2-3 times per week with offers, updates, events, or products. Include CTAs, images, and primary keywords.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 14. Infrequent Posts (1-4 posts in 30 days) (8 points)
  else if (business.postsLast30Days !== undefined && business.postsLast30Days > 0 && business.postsLast30Days < 5) {
    score += 8;
    issues.push({
      title: 'Infrequent GMB Posts',
      description: `Only ${business.postsLast30Days} posts in last 30 days. Increase frequency to 8-12 posts monthly for competitive edge.`,
      severity: 'warning',
      points: 8,
    });
    recommendations.push({
      title: 'Increase Posting Frequency',
      description: 'Aim for 2-3 posts per week. Schedule posts in advance. Mix content types: offers, events, products, Q&A.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 15. No Recent Posts (10 points)
  if (!business.hasRecentPosts && business.postsLast30Days !== undefined && business.postsLast30Days > 0) {
    score += 10;
    issues.push({
      title: 'No Recent Posts',
      description: 'No posts in last 7 days. Fresh content signals active business management to Google.',
      severity: 'warning',
      points: 10,
    });
    recommendations.push({
      title: 'Resume Regular Posting',
      description: 'Post within next 24 hours. Set up weekly posting schedule. Recent posts boost engagement signals.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 16. No Owner Photos (12 points)
  if (business.ownerPhotoCount !== undefined && business.ownerPhotoCount === 0 && business.photosCount > 0) {
    score += 12;
    issues.push({
      title: 'No Owner-Uploaded Photos',
      description: 'All photos are customer-uploaded. Owner photos get 35% more views and improve trust.',
      severity: 'critical',
      points: 12,
    });
    recommendations.push({
      title: 'Upload Professional Photos',
      description: 'Add high-quality owner photos: exterior, interior, products/services, team. Aim for 30+ professional photos.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 17. Low Owner Photo Ratio (8 points)
  else if (business.ownerPhotoCount !== undefined && business.customerPhotoCount !== undefined &&
           business.ownerPhotoCount > 0 && business.customerPhotoCount > 0) {
    const ownerRatio = business.ownerPhotoCount / (business.ownerPhotoCount + business.customerPhotoCount);
    if (ownerRatio < 0.6) {
      score += 8;
      issues.push({
        title: 'Low Owner Photo Ratio',
        description: `Only ${Math.round(ownerRatio * 100)}% of photos are owner-uploaded. Target 60%+ to control brand image.`,
        severity: 'warning',
        points: 8,
      });
      recommendations.push({
        title: 'Increase Owner Photo Uploads',
        description: 'Upload more professional photos to maintain majority owner content. Update quarterly with fresh images.',
        priority: 'P2',
        impact: 'Medium',
      });
    }
  }

  // 18. No Videos (10 points)
  if (business.videoCount !== undefined && business.videoCount === 0) {
    score += 10;
    issues.push({
      title: 'No Videos',
      description: 'Listings with videos get 2.7x more website clicks. Video content increases engagement significantly.',
      severity: 'warning',
      points: 10,
    });
    recommendations.push({
      title: 'Add Business Videos',
      description: 'Upload 30-60 second videos: business tour, service demos, team introduction, customer testimonials.',
      priority: 'P2',
      impact: 'High',
    });
  }

  // 19. Missing Logo or Cover Photo (8 points)
  if (!business.hasLogo || !business.hasCoverPhoto) {
    score += 8;
    issues.push({
      title: 'Missing Logo or Cover Photo',
      description: !business.hasLogo && !business.hasCoverPhoto
        ? 'No logo AND no cover photo. These are critical for brand recognition.'
        : !business.hasLogo
          ? 'No business logo. This hurts brand identity and professional appearance.'
          : 'No cover photo. Missing opportunity to showcase business personality.',
      severity: 'critical',
      points: 8,
    });
    recommendations.push({
      title: 'Add Logo and Cover Photo',
      description: 'Upload square logo (720x720px min) and landscape cover photo (1024x576px). Use high-quality branded images.',
      priority: 'P1',
      impact: 'Medium',
    });
  }

  // 20. No Q&A Content (8 points)
  if (!business.hasQuestionsAndAnswers || (business.qaCount !== undefined && business.qaCount === 0)) {
    score += 8;
    issues.push({
      title: 'No Questions & Answers',
      description: 'Q&A section empty. This is free keyword-rich content that appears in search results.',
      severity: 'warning',
      points: 8,
    });
    recommendations.push({
      title: 'Seed Q&A Section',
      description: 'Add 10-15 common customer questions. Include service details, pricing ranges, parking, hours. Use natural language with keywords.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 21. Few Q&A (1-5) (5 points)
  else if (business.qaCount !== undefined && business.qaCount > 0 && business.qaCount < 6) {
    score += 5;
    issues.push({
      title: 'Insufficient Q&A Content',
      description: `Only ${business.qaCount} questions. Add 10-20 FAQs for better keyword coverage.`,
      severity: 'info',
      points: 5,
    });
    recommendations.push({
      title: 'Expand Q&A Section',
      description: 'Add questions about services, pricing, availability, service area, payment options, and expertise.',
      priority: 'P3',
      impact: 'Low',
    });
  }

  // 22. No Services Listed (10 points)
  if (!business.hasServices || (business.servicesCount !== undefined && business.servicesCount === 0)) {
    score += 10;
    issues.push({
      title: 'No Services Listed',
      description: 'Services section empty. Critical for service-based businesses to show offerings and improve keyword relevance.',
      severity: 'critical',
      points: 10,
    });
    recommendations.push({
      title: 'Add Service Offerings',
      description: 'List all services with descriptions. Include pricing if applicable. Use keyword-rich service names.',
      priority: 'P1',
      impact: 'High',
    });
  }

  // 23. Few Services (1-5) (6 points)
  else if (business.servicesCount !== undefined && business.servicesCount > 0 && business.servicesCount < 6) {
    score += 6;
    issues.push({
      title: 'Limited Services Listed',
      description: `Only ${business.servicesCount} services. Most competitive profiles have 10+ service listings.`,
      severity: 'warning',
      points: 6,
    });
    recommendations.push({
      title: 'Expand Service Listings',
      description: 'Break down services into specific offerings. Add specialty services, packages, and variations.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 24. No Attributes (8 points)
  if (!business.hasAttributes || (business.attributesCount !== undefined && business.attributesCount === 0)) {
    score += 8;
    issues.push({
      title: 'No Attributes Selected',
      description: 'Attributes empty. These highlight amenities and unique features (wheelchair accessible, wifi, parking, etc).',
      severity: 'warning',
      points: 8,
    });
    recommendations.push({
      title: 'Add Business Attributes',
      description: 'Select all applicable attributes: accessibility, amenities, crowd info, payments accepted, highlights.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // 25. Poor Review Response Rate (<50%) (12 points)
  if (business.reviewResponseRate !== undefined && business.totalReviews >= 5) {
    if (business.reviewResponseRate < 50) {
      score += 12;
      issues.push({
        title: 'Very Low Review Response Rate',
        description: `Only ${Math.round(business.reviewResponseRate)}% of reviews responded to. Responding to reviews boosts rankings by 12%.`,
        severity: 'critical',
        points: 12,
      });
      recommendations.push({
        title: 'Respond to All Reviews',
        description: 'Set up review alerts. Respond to ALL reviews (positive and negative) within 24-48 hours. Use personalized responses.',
        priority: 'P1',
        impact: 'High',
      });
    }
    // 26. Moderate Response Rate (50-80%) (6 points)
    else if (business.reviewResponseRate < 80) {
      score += 6;
      issues.push({
        title: 'Inconsistent Review Responses',
        description: `${Math.round(business.reviewResponseRate)}% response rate. Aim for 90%+ to maximize engagement signals.`,
        severity: 'warning',
        points: 6,
      });
      recommendations.push({
        title: 'Improve Response Consistency',
        description: 'Respond to all new reviews within 48 hours. Catch up on old unanswered reviews.',
        priority: 'P2',
        impact: 'Medium',
      });
    }
  }

  // 27. GMB Profile Completeness
  const completenessScore = calculateCompleteness(business);
  if (completenessScore < 50) {
    score += 15;
    issues.push({
      title: 'Incomplete GMB Profile',
      description: `Profile is only ${completenessScore}% complete. 100% complete profiles get 7x more engagement.`,
      severity: 'critical',
      points: 15,
    });
    recommendations.push({
      title: 'Complete All GMB Fields',
      description: 'Add: Description (750 chars), services/products, attributes, business category, opening date, Q&A.',
      priority: 'P1',
      impact: 'High',
    });
  } else if (completenessScore < 80) {
    score += 8;
    issues.push({
      title: 'Profile Needs More Details',
      description: `Profile is ${completenessScore}% complete. Add remaining fields for maximum visibility.`,
      severity: 'warning',
      points: 8,
    });
    recommendations.push({
      title: 'Fill Remaining Profile Fields',
      description: 'Complete attributes, add more service details, upload business logo and cover photo.',
      priority: 'P2',
      impact: 'Medium',
    });
  }

  // Determine priority status (FIXED: Lower score = Better)
  let priorityStatus: 'high' | 'medium' | 'low';
  if (score >= 60) {
    priorityStatus = 'high'; // Needs urgent work
  } else if (score >= 30) {
    priorityStatus = 'medium'; // Needs improvements
  } else {
    priorityStatus = 'low'; // Well optimized
  }

  // Add general recommendations for well-optimized profiles
  if (score < 30) {
    recommendations.push({
      title: 'Maintain Optimization Level',
      description: 'Continue posting weekly GMB updates, respond to all reviews within 24h, refresh photos monthly.',
      priority: 'P3',
      impact: 'Medium',
    });
    recommendations.push({
      title: 'Advanced GMB Tactics',
      description: 'Enable GMB messaging, add Q&A content, use Google Posts 2-3x/week, optimize for voice search.',
      priority: 'P3',
      impact: 'Low',
    });
  }

  // If no issues found, add a positive message
  if (issues.length === 0) {
    issues.push({
      title: 'Profile is Well-Optimized',
      description: 'This GMB profile meets core optimization standards. Continue maintaining this level.',
      severity: 'info',
      points: 0,
    });
  }

  return {
    priorityScore: Math.min(100, score),
    priorityStatus,
    issues,
    recommendations,
    completenessScore,
  };
}

function calculateCompleteness(business: BusinessData): number {
  let completed = 0;
  const total = 25;

  // Core fields
  if (business.name) completed++;
  if (business.address) completed++;
  if (business.phone) completed++;
  if (business.website) completed++;
  if (business.hasHours) completed++;
  if (business.operational) completed++;
  if (business.types && business.types.length > 0) completed++;

  // Reviews & Rating
  if (business.rating > 0) completed++;
  if (business.totalReviews >= 10) completed++;
  if (business.reviewResponseRate !== undefined && business.reviewResponseRate >= 80) completed++;

  // Photos & Media
  if (business.photosCount >= 10) completed++;
  if (business.photosCount >= 30) completed++;
  if (business.hasLogo) completed++;
  if (business.hasCoverPhoto) completed++;
  if (business.ownerPhotoCount !== undefined && business.ownerPhotoCount >= 20) completed++;
  if (business.videoCount !== undefined && business.videoCount > 0) completed++;

  // Content & Engagement
  if (business.hasDescription && business.descriptionLength !== undefined && business.descriptionLength >= 500) completed++;
  if (business.hasServices && business.servicesCount !== undefined && business.servicesCount >= 5) completed++;
  if (business.hasAttributes && business.attributesCount !== undefined && business.attributesCount >= 5) completed++;
  if (business.hasQuestionsAndAnswers && business.qaCount !== undefined && business.qaCount >= 10) completed++;

  // GMB Posts
  if (business.postsLast30Days !== undefined && business.postsLast30Days >= 8) completed++;
  if (business.hasRecentPosts) completed++;

  // Advanced engagement
  if (business.totalReviews >= 50) completed++;
  if (business.rating >= 4.5) completed++;
  if (business.photosCount >= 100) completed++;

  return Math.round((completed / total) * 100);
}
