import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const url = process.env.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SHEET_BARTER_URL || '';

async function testFetch() {
  console.log('Testing fetch from URL:', url);
  try {
    const response = await axios.get(url, {
      maxRedirects: 10,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, text/csv, */*'
      }
    });

    console.log('Status code:', response.status);
    console.log('Content type:', response.headers['content-type']);
    console.log('Data type:', typeof response.data);

    let data = response.data;
    if (typeof data === 'string') {
      console.log('First 500 chars of string data:');
      console.log(data.slice(0, 500));
    } else if (Array.isArray(data)) {
      console.log(`Array of ${data.length} items. First item:`);
      console.log(data[0]);
    } else if (typeof data === 'object') {
      console.log('Object keys:', Object.keys(data));
      console.log('Data sample:', JSON.stringify(data).slice(0, 500));
    }
  } catch (err: any) {
    console.error('Error fetching:', err.message);
  }
}

testFetch();
