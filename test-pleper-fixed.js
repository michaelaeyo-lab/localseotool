const axios = require('axios');
const crypto = require('crypto');

const API_KEY = '7ad3edc2f70f9152bb99b464d9170084';
const API_SECRET = '43299460abe6431c457b8fe69d4af6624957b96d';
const API_BASE = 'https://pleper.com/api/v1';

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

async function testNewAPI() {
  try {
    console.log('Testing corrected PlePer API...\n');
    
    // Test 1: Create batch
    console.log('1. Creating batch...');
    const params1 = {};
    const sig1 = calculateSignature(params1);
    const batch = await axios.post(
      `${API_BASE}/batch_create`,
      new URLSearchParams({
        'api-key': API_KEY,
        'api-sig': sig1,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Batch created:', batch.data);
    
    const batchId = batch.data['batch-id'];
    
    // Test 2: Add job
    console.log('\n2. Adding job to batch...');
    const params2 = { 'batch-id': batchId, cid: '7679954000691482765' };
    const sig2 = calculateSignature(params2);
    const job = await axios.post(
      `${API_BASE}/google/by-cid/information`,
      new URLSearchParams({
        'api-key': API_KEY,
        'api-sig': sig2,
        ...params2,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('✅ Job added:', job.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Response:', error.response?.data);
  }
}

testNewAPI();
