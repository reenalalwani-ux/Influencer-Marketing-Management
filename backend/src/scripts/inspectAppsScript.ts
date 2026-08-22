import axios from 'axios';

const url = 'https://script.google.com/macros/s/AKfycbwNv3pDStT-kRQ4zlQ9bB0snEfxqgZ--6BNarou3RNR3KWY6qebp4Uq94jerw7_5xJHaw/exec';

async function inspectData() {
  try {
    console.log('Fetching JSON from Apps Script Web App...');
    const res = await axios.get(url, { maxRedirects: 10 });
    console.log('HTTP Status:', res.status);
    console.log('Data type:', typeof res.data);
    if (Array.isArray(res.data)) {
      console.log(`Returned ${res.data.length} rows!`);
      if (res.data.length > 0) {
        console.log('Sample Row 1 Keys:', Object.keys(res.data[0]));
        console.log('Sample Row 1 Data:', JSON.stringify(res.data[0], null, 2));
      }
    } else {
      console.log('Response data:', res.data);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

inspectData();
