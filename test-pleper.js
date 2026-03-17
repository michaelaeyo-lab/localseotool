const axios = require('axios');

const PLEPER_API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SIG = '43299460abe6431c457b8fe69d4af6624957b96d';
const PLEPER_API_BASE = 'https://scrape.pleper.com/v3/';

async function testPlePer() {
  try {
    console.log('Testing PlePer API...');
    console.log('API Key:', PLEPER_API_KEY);
    console.log('API Sig:', PLEPER_API_SIG);
    
    const response = await axios.post(
      `${PLEPER_API_BASE}batch_add_job`,
      {
        api_key: PLEPER_API_KEY,
        api_sig: PLEPER_API_SIG,
        batch_id: 'new',
        method: 'google/by-profile/information',
        profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M',
      }
    );
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Response:', error.response?.data);
    console.error('Status:', error.response?.status);
  }
}

testPlePer();
