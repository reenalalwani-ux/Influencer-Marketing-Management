import { scrapeInstagramProfile } from '../services/instagramMetadataScraper';

const run = async () => {
  const res = await scrapeInstagramProfile('bhartigurnani_');
  console.log('BHARTI SCRAPED RESULT:\n', JSON.stringify(res, null, 2));
};

run();
