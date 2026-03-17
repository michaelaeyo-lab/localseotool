/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    SERP_API_KEY: process.env.SERP_API_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    PLEPER_API_KEY: process.env.PLEPER_API_KEY,
    PLEPER_API_SIGNATURE: process.env.PLEPER_API_SIGNATURE,
  },
}

module.exports = nextConfig
