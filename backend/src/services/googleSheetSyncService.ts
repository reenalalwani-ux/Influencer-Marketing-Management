import { Influencer, Brand, Target, GoogleSheetConfig, User, Employee } from '../models/allModels';
import axios from 'axios';
import { google } from 'googleapis';
import dns from 'dns';
import https from 'https';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const httpsAgent = new https.Agent({
  family: 4, // Force IPv4 to prevent IPv6 connection timeouts
  keepAlive: true,
  timeout: 30000
});

// Helper to parse dates (e.g. "8/4/2026", "2026-08-04", etc.)
function parseSheetDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const str = String(val).trim();
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(str)) {
    const parts = str.split(/[\/\-\.]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2].slice(0, 4), 10);
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  const parsed = new Date(str);
  return !isNaN(parsed.getTime()) ? parsed : new Date();
}

// Helper to parse CSV string into array of objects
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const cleanHeader = h.trim().replace(/^"|"$/g, '');
      const cellVal = row[idx] ? row[idx].trim().replace(/^"|"$/g, '') : '';
      record[cleanHeader] = cellVal;
    });
    records.push(record);
  }

  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Core function to insert / upsert Barter records from row objects
export async function processBarterRows(rows: Record<string, string>[]): Promise<number> {
  let syncedCount = 0;

  // Fetch all registered users and employees to validate Assignee against database
  const registeredUsers = await User.find({}, 'name email').lean();
  const registeredEmployees = await Employee.find({}, 'name email').lean();
  
  const validMemberNames = Array.from(new Set([
    ...registeredUsers.map(u => (u.name || '').trim()),
    ...registeredEmployees.map(e => (e.name || '').trim())
  ])).filter(name => name.length > 0);

  for (const row of rows) {
    // Extract column values matching sheet headers case-insensitively
    const getCol = (...names: string[]) => {
      for (const n of names) {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === n.toLowerCase());
        if (key && row[key] && String(row[key]).trim().length > 0) return String(row[key]).trim();
      }
      return '';
    };

    const rowDateStr = getCol('Column 1', 'Date', 'Order date', 'Order Date', 'Transaction Date', 'DATE') || '';
    const brandName = getCol('BRAND NAME', 'Brand Name', 'BRAND', 'Brand');
    const rawInfName = getCol('Influencers id', 'INFLUENCERS NAME / Instagram ID', 'Influencer Name', 'Influencer', 'INFLUENCERS NAME', 'Instagram ID', 'Influencers ID');
    const rawAssignee = getCol('Assigne', 'Assignee', 'Assigned To');
    const rawManager = getCol('BRAND MANAGER', 'Brand Manager', 'Manager Name', 'Manager');
    const rawTeam = getCol('Brand Manager Team', 'Manager Team', 'Team');
    const categoryCol = getCol('Column 20', 'Category', 'TYPE', 'Type') || '';
    const productLink = getCol('PRODUCT LINK', 'Product Link') || '';
    const videoType = getCol('Type of Video', 'Video Type') || 'Single Product Video';
    const videoDescription = getCol('video description', 'Video Description') || '';
    const refVideoLink = getCol('REFRENCE VIDEO LINK', 'Reference Video Link', 'Ref Link') || '';
    const orderId = getCol('Order ID', 'OrderID', 'Order Id') || '';

    // Skip empty rows that have neither brandName, influencer name, orderId, productLink, nor videoDescription
    if (!brandName && !rawInfName && !orderId && !productLink && !videoDescription) continue;

    // Strict Employee / Team Member Assignee Matching:
    // Check Assigne (Column F), BRAND MANAGER (Column D), Brand Manager Team (Column E)
    let matchedMemberName = '';
    const candidateNames = [rawAssignee, rawManager, rawTeam].filter(Boolean);
    for (const cand of candidateNames) {
      const cleanCand = cand.trim().toLowerCase();
      const match = validMemberNames.find(m => {
        const lowM = m.toLowerCase();
        return lowM === cleanCand || lowM.split(' ')[0] === cleanCand || cleanCand.split(' ')[0] === lowM;
      });
      if (match) {
        matchedMemberName = match;
        break;
      }
    }

    const managerName = matchedMemberName;
    const managerTeam = matchedMemberName ? (rawTeam || rawManager) : '';

    const finalInfName = rawInfName || (orderId ? `Creator #${orderId}` : (brandName ? `${brandName} Creator` : 'Barter Creator'));
    const contentLink = getCol('CONTENT LINK', 'Content Link') || '';
    const adsCode = getCol('ADS CODE', 'Ads Code') || '';
    const approvalRaw = getCol('Approved or not', 'Approved Or Not', 'Approval Status') || 'Pending';
    const reason = getCol('Reason', 'REASON', 'Remarks') || '';

    // Clean influencer name
    const cleanInfName = finalInfName.replace(/\s*\((Barter|Paid)\)\s*/gi, '').trim() || finalInfName;
    const instaId = finalInfName.startsWith('@') ? finalInfName : parseInstagramHandle(finalInfName);

    const parsedRowDate = rowDateStr ? parseSheetDate(rowDateStr) : undefined;
    const transactionDate = parsedRowDate || new Date();

    // Determine approval status
    let approvalStatus: 'Approved' | 'Not Approved' | 'Pending' = 'Pending';
    if (approvalRaw.toLowerCase().includes('yes') || approvalRaw.toLowerCase().includes('approved') || approvalRaw.toLowerCase() === 'true') {
      approvalStatus = 'Approved';
    } else if (approvalRaw.toLowerCase().includes('no') || approvalRaw.toLowerCase().includes('not')) {
      approvalStatus = 'Not Approved';
    }

    // Map status
    const statusRaw = getCol('STATUS', 'Status') || 'Pending';
    let finalStatus: 'Pending' | 'Under Review' | 'Completed' | 'Settled' | 'Approved' = 'Pending';
    const lowerStat = statusRaw.toLowerCase();
    if (lowerStat.includes('completed') || lowerStat.includes('done')) finalStatus = 'Completed';
    else if (lowerStat.includes('approved')) finalStatus = 'Approved';
    else if (lowerStat.includes('settle')) finalStatus = 'Settled';
    else if (lowerStat.includes('review')) finalStatus = 'Under Review';

    // Deduplicate using Order ID or (brandName + influencerName)
    const dedupeQuery: any = { category: 'Barter' };
    if (orderId) {
      dedupeQuery.orderId = orderId;
    } else {
      dedupeQuery.brandName = brandName;
      dedupeQuery.influencerName = cleanInfName;
    }

    const existing = await Influencer.findOne(dedupeQuery);

    if (existing) {
      existing.influencerManager = managerName;
      existing.brandManagerTeam = managerTeam;
      existing.productLink = productLink || existing.productLink;
      existing.videoType = videoType || existing.videoType;
      existing.videoDescription = videoDescription || existing.videoDescription;
      existing.refVideoLink = refVideoLink || existing.refVideoLink;
      if (parsedRowDate) existing.orderDate = parsedRowDate;
      if (parsedRowDate) existing.transactionDate = parsedRowDate;
      existing.status = finalStatus;
      existing.contentLink = contentLink || existing.contentLink;
      existing.adsCode = adsCode || existing.adsCode;
      existing.influencerInstagramId = instaId || existing.influencerInstagramId;
      existing.approvalStatus = approvalStatus;
      existing.reason = reason || existing.reason;
      existing.isApproved = approvalStatus === 'Approved' || finalStatus === 'Completed';

      await existing.save();
      syncedCount++;
    } else {
      const count = await Influencer.countDocuments();
      await Influencer.create({
        sNo: count + 1,
        transactionDate,
        connectedDate: transactionDate,
        category: 'Barter',
        brandName,
        influencerName: cleanInfName,
        influencerInstagramId: instaId,
        profileLink: instaId.startsWith('http') ? instaId : (instaId ? `https://instagram.com/${instaId.replace(/^@/, '')}` : ''),
        influencerManager: managerName,
        brandManagerTeam: managerTeam,
        productLink,
        videoType,
        videoDescription,
        refVideoLink,
        orderId,
        orderDate: parsedRowDate,
        status: finalStatus,
        contentLink,
        adsCode,
        approvalStatus,
        isApproved: approvalStatus === 'Approved' || finalStatus === 'Completed',
        reason,
        brandOnboardingAmt: 0,
        brandReceivedAmt: 0,
        brandPendingAmt: 0,
        influencerOnboardingAmt: 0,
        influencerPaidAmt: 0,
        influencerPendingAmt: 0,
        ad2shipMargin: 0,
        inAmount: 0,
        outAmount: 0,
        balance: 0
      });
      syncedCount++;
    }
  }

  return syncedCount;

  return syncedCount;
}

// Fetch Google Sheets API v4 using Service Account (For Private Sheets)
async function fetchViaServiceAccount(sheetId: string): Promise<Record<string, string>[]> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!serviceAccountEmail || !privateKey) return [];

  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A1:Z500'
  });

  const valueRows = response.data.values;
  if (!valueRows || valueRows.length === 0) return [];

  const headers = valueRows[0].map(h => String(h).trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < valueRows.length; i++) {
    const rowValues = valueRows[i];
    if (!rowValues || rowValues.length === 0) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = rowValues[idx] ? String(rowValues[idx]).trim() : '';
    });
    records.push(record);
  }

  return records;
}

export async function syncBarterFromGoogleSheet(): Promise<{
  success: boolean;
  syncedCount: number;
  message: string;
}> {
  try {
    let config = await GoogleSheetConfig.findOne();
    const defaultUrl = process.env.GOOGLE_SHEET_BARTER_URL || process.env.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SHEET_CSV_URL || '';
    if (!config) {
      config = await GoogleSheetConfig.create({
        sheetUrl: defaultUrl,
        autoSyncEnabled: true,
        syncIntervalSeconds: 60,
        lastSyncStatus: 'IDLE'
      });
    }

    const targetUrl = (config && config.sheetUrl && config.sheetUrl.trim().length > 0) 
      ? config.sheetUrl.trim() 
      : defaultUrl;

    // Check if Google Service Account is configured in backend/.env for PRIVATE Sheets!
    const sheetIdMatch = targetUrl ? targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/) : null;
    const extractedSheetId = sheetIdMatch ? sheetIdMatch[1] : (process.env.GOOGLE_SHEET_ID || '');

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && extractedSheetId) {
      console.log(`[GoogleSheetSync] Using Google Service Account API v4 for Private Sheet (${extractedSheetId.slice(0, 8)}...)...`);
      const serviceAccountRows = await fetchViaServiceAccount(extractedSheetId);
      if (serviceAccountRows.length > 0) {
        const syncedCount = await processBarterRows(serviceAccountRows);
        config.lastSyncedAt = new Date();
        config.lastSyncedCount = syncedCount;
        config.lastSyncStatus = 'SUCCESS';
        config.lastSyncMessage = `Successfully synced ${syncedCount} private Barter records via Google Sheets API v4`;
        await config.save();
        return { success: true, syncedCount, message: config.lastSyncMessage };
      }
    }

    if (!targetUrl) {
      config.lastSyncStatus = 'ERROR';
      config.lastSyncMessage = 'No Google Sheet URL or Apps Script URL configured in settings or backend .env';
      await config.save();
      return {
        success: false,
        syncedCount: 0,
        message: 'No Google Sheet URL configured. Please add URL in settings or backend .env'
      };
    }

    let fetchUrl = targetUrl;
    if (targetUrl.includes('docs.google.com/spreadsheets/d/')) {
      const matches = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        const sheetId = matches[1];
        fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      }
    }



    console.log(`[GoogleSheetSync] Fetching Barter data from URL (${fetchUrl.slice(0, 45)}...)...`);
    
    // Retry loop (up to 3 attempts with exponential backoff)
    let response: any = null;
    let lastErr: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await axios.get(fetchUrl, {
          httpsAgent,
          timeout: 30000,
          maxRedirects: 10,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/csv, text/plain, */*'
          }
        });
        if (response && response.data) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`[GoogleSheetSync Attempt ${attempt}/3] Network latency warning: ${err.message}. Retrying...`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
      }
    }

    if (!response || !response.data) {
      throw lastErr || new Error('Failed to fetch Google Sheet after 3 attempts');
    }

    const rawData = response.data;
    let rows: Record<string, string>[] = [];

    if (typeof rawData === 'string') {
      if (rawData.includes('<!DOCTYPE html') || rawData.includes('<html') || rawData.includes('google.com/accounts')) {
        throw new Error('Google returned a private login page. For PRIVATE sheets, please see solution options in the setup guide.');
      }
      rows = parseCSV(rawData);
    } else if (Array.isArray(rawData)) {
      rows = rawData;
    } else if (typeof rawData === 'object' && rawData !== null) {
      if (Array.isArray(rawData.data)) rows = rawData.data;
      else if (Array.isArray(rawData.rows)) rows = rawData.rows;
      else if (Array.isArray(rawData.items)) rows = rawData.items;
    }

    if (rows.length === 0) {
      config.lastSyncedAt = new Date();
      config.lastSyncStatus = 'SUCCESS';
      config.lastSyncMessage = 'Sync checked, 0 records found';
      await config.save();
      return { success: true, syncedCount: 0, message: 'Google Sheet checked (0 records)' };
    }

    const syncedCount = await processBarterRows(rows);

    config.lastSyncedAt = new Date();
    config.lastSyncedCount = syncedCount;
    config.lastSyncStatus = 'SUCCESS';
    config.lastSyncMessage = `Successfully synced ${syncedCount} Barter records from Google Sheet`;
    await config.save();

    console.log(`[GoogleSheetSync] ${config.lastSyncMessage}`);
    return { success: true, syncedCount, message: config.lastSyncMessage };
  } catch (error: any) {
    console.error('[GoogleSheetSync Error]:', error.message || error);
    try {
      const config = await GoogleSheetConfig.findOne();
      if (config) {
        config.lastSyncStatus = 'ERROR';
        config.lastSyncMessage = error.message || 'Error fetching Google Sheet';
        await config.save();
      }
    } catch (e) {}

    return {
      success: false,
      syncedCount: 0,
      message: error.message || 'Failed to sync with Google Sheet'
    };
  }
}

function parseInstagramHandle(urlOrText: any): string {
  if (!urlOrText) return '';
  const str = String(urlOrText).trim();
  if (str.includes('instagram.com/')) {
    const parts = str.split('instagram.com/')[1].split('/')[0].split('?')[0];
    if (parts && parts !== 'reel' && parts !== 'p' && parts !== 'reels') {
      return str.startsWith('@') ? str : '@' + parts;
    }
  }
  if (!str.startsWith('http') && str.length < 35 && !str.includes('/') && !str.includes('?')) {
    return str.startsWith('@') ? str : '@' + str;
  }
  return '';
}
