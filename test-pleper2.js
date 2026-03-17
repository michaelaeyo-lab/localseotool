const axios = require('axios');

const PLEPER_API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const PLEPER_API_SIG = '43299460abe6431c457b8fe69d4af6624957b96d';

async function testFormData() {
  try {
    console.log('Testing with query params...');
    const response = await axios.post(
      'https://scrape.pleper.com/v3/batch_add_job',
      null,
      {
        params: {
          api_key: PLEPER_API_KEY,
          api_sig: PLEPER_API_SIG,
          batch_id: 'new',
          method: 'google/by-profile/information',
          profile_url: 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M',
        }
      }
    );
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Query params error:', error.response?.data);
  }

  try {
    console.log('\nTesting with form data...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('api_key', PLEPER_API_KEY);
    form.append('api_sig', PLEPER_API_SIG);
    form.append('batch_id', 'new');
    form.append('method', 'google/by-profile/information');
    form.append('profile_url', 'https://search.google.com/local/reviews?placeid=ChIJ704hNyeSQxARJvGBTzF6M');
    
    const response = await axios.post(
      'https://scrape.pleper.com/v3/batch_add_job',
      form,
      {
        headers: form.getHeaders()
      }
    );
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Form data error:', error.response?.data);
  }
}

testFormData();
