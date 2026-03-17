const axios = require('axios');
const qs = require('querystring');

const PLEPER_API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SIG = '43299460abe6431c457b8fe69d4af6624957b96d';

async function testURLEncoded() {
  try {
    console.log('Testing with URL-encoded form data...');
    const data = qs.stringify({
      api_key: PLEPER_API_KEY,
      api_sig: PLEPER_API_SIG,
      batch_id: 'new',
      method: 'google/by-profile/information',
      profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M',
    });
    
    const response = await axios.post(
      'https://scrape.pleper.com/v3/batch_add_job',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    console.log('✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testURLEncoded();
