const axios = require('axios');
const crypto = require('crypto');

const API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const API_SECRET = '43299460abe6431c457b8fe69d4af6624957b96d';
const API_BASE = 'https://scrape.pleper.com/v3';

function calculateSignature(params) {
  const sortedKeys = Object.keys(params).sort().reverse();
  const sortedParams = {};
  sortedKeys.forEach(key => {
    sortedParams[key] = params[key];
  });

  const signatureString = API_KEY + JSON.stringify(sortedParams);
  const signature = crypto.createHmac('sha1', API_SECRET).update(signatureString).digest('hex');
  return signature;
}

async function testScrapeAPI() {
  try {
    console.log('Testing PlePer Scrape API v3...\n');
    
    const params = {
      batch_id: 'new',
      profile_url: 'https://maps.google.com/?cid=4569775912639662016',
    };
    
    const signature = calculateSignature(params);
    
    const response = await axios.post(
      `${API_BASE}/google/by-profile/information`,
      new URLSearchParams({
        api_key: API_KEY,
        api_sig: signature,
        ...params,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

testScrapeAPI();
