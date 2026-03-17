const axios = require('axios');
const FormData = require('form-data');

const PLEPER_API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SIG = '43299460abe6431c457b8fe69d4af6624957b96d';

async function testMethods() {
  const methods = [
    'google/by-profile/information',
    '/google/by-profile/information',
    'google_by_profile_information',
    'listing_info',
  ];

  for (const method of methods) {
    try {
      console.log(`\nTesting method: "${method}"`);
      const form = new FormData();
      form.append('api_key', PLEPER_API_KEY);
      form.append('api_sig', PLEPER_API_SIG);
      form.append('batch_id', 'new');
      form.append('method', method);
      form.append('profile_url', 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M');
      
      const response = await axios.post(
        'https://scrape.pleper.com/v3/batch_add_job',
        form,
        { headers: form.getHeaders() }
      );
      console.log('✅ SUCCESS with method:', method);
      console.log('Response:', response.data);
      break;
    } catch (error) {
      console.log('❌ Failed:', error.response?.data?.errors || error.message);
    }
  }
}

testMethods();
