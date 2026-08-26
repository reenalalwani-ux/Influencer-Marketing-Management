import axios from 'axios';

const testHandles = ['_anaaya.26', 'bhartigurnani_', 'tanisshaa.09', 'lifewidsimmi', 'kajaaaal__', 'pallavi131'];

const runTest = async () => {
  for (const handle of testHandles) {
    try {
      const url = `https://www.instagram.com/${handle}/`;
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 10000
      });

      const html: string = res.data || '';
      // Extract meta description
      const descMatch = html.match(/content="([^"]*Followers[^"]*)"/i) || html.match(/content="([^"]*following[^"]*)"/i);
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/property="og:title"\s+content="([^"]+)"/i);
      const imageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);

      console.log(`\n--- HANDLE: @${handle} ---`);
      console.log('DESC:', descMatch ? descMatch[1] : 'No meta desc');
      console.log('TITLE:', titleMatch ? titleMatch[1] : 'No title');
      console.log('IMAGE:', imageMatch ? imageMatch[1].slice(0, 100) : 'No image');
    } catch (err: any) {
      console.error(`ERROR for @${handle}:`, err.message);
    }
  }
};

runTest();
