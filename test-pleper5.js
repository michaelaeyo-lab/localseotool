const axios = require('axios');
const qs = require('querystring');

const PLEPER_API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SIG = '43299460abe6431c457b8fe69d4af6624957b96d';

async function testDifferentParams() {
  const tests = [
    { name: 'action instead of method', params: { api_key: PLEPER_API_KEY, api_sig: PLEPER_API_SIG, batch_id: 'new', action: 'google/by-profile/information', profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M' } },
    { name: 'type instead of method', params: { api_key: PLEPER_API_KEY, api_sig: PLEPER_API_SIG, batch_id: 'new', type: 'google/by-profile/information', profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M' } },
    { name: 'scrape_method', params: { api_key: PLEPER_API_KEY, api_sig: PLEPER_API_SIG, batch_id: 'new', scrape_method: 'google/by-profile/information', profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M' } },
    { name: 'no batch_id', params: { api_key: PLEPER_API_KEY, api_sig: PLEPER_API_SIG, method: 'google/by-profile/information', profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M' } },
  ];

  for (const test of tests) {
    try {
      console.log(`\nTesting: ${test.name}`);
      const response = await axios.post(
        'https://scrape.pleper.com/v3/batch_add_job',
        qs.stringify(test.params),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      console.log('✅ SUCCESS with:', test.name);
      console.log('Response:', response.data);
      break;
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors || error.message);
    }
  }
}

testDifferentParams();
