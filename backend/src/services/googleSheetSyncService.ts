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

// Helper to parse "recieved by rahul", "done by rahul", "received by X", "paid by Y" from REMARK/ACCOUNT OWNER NAME column
function parseAccountOwnerDetails(remark: string, inAmt: number = 0, outAmt: number = 0) {
  let moneyReceivedBy = '';
  let paymentDoneBy = '';

  if (!remark) return { moneyReceivedBy, paymentDoneBy };

  const recMatch = remark.match(/(?:recieved|received|got|in)\s+(?:by\s+)?([a-zA-Z0-9_\s.]+)/i);
  const doneMatch = remark.match(/(?:done|paid|given|out|transferred)\s+(?:by\s+)?([a-zA-Z0-9_\s.]+)/i);

  if (recMatch && recMatch[1]) {
    moneyReceivedBy = recMatch[1].trim();
  }
  if (doneMatch && doneMatch[1]) {
    paymentDoneBy = doneMatch[1].trim();
  }

  if (!moneyReceivedBy && !paymentDoneBy) {
    const clean = remark.replace(/^(?:recieved|received|done|paid)\s+by\s+/i, '').replace(/^by\s+/i, '').trim();
    if (clean.length > 0 && clean.length < 30) {
      if (inAmt > 0 || remark.toLowerCase().includes('recie') || remark.toLowerCase().includes('receiv')) {
        moneyReceivedBy = clean;
      }
      if (outAmt > 0 || remark.toLowerCase().includes('done') || remark.toLowerCase().includes('paid')) {
        paymentDoneBy = clean;
      }
    }
  }

  return { moneyReceivedBy, paymentDoneBy };
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
  const syncedDocIds: any[] = [];

  // Fetch all registered users and employees to validate Assignee against database
  const registeredUsers = await User.find({}, 'name email').lean();
  const registeredEmployees = await Employee.find({}, 'name email').lean();
  
  const validMemberNames = Array.from(new Set([
    ...registeredUsers.map(u => (u.name || '').trim()),
    ...registeredEmployees.map(e => (e.name || '').trim())
  ])).filter(name => name.length > 0);

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    // Extract column values matching sheet headers case-insensitively
    const getCol = (...names: string[]) => {
      for (const n of names) {
        const key = Object.keys(row).find(k => k.trim().toLowerCase() === n.toLowerCase());
        if (key && row[key] && typeof row[key] !== 'object' && String(row[key]).trim().length > 0) return String(row[key]).trim();
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
    const remarkRaw = getCol('REMARK/ACCOUNT OWNER NAME', 'REMARK / ACCOUNT OWNER NAME', 'Account Owner Name', 'REMARK', 'Remark', 'Remarks') || '';
    const inAmtRaw = Number(getCol('IN', 'In', 'Brand Price', 'Brand Onboarding')) || 0;
    const outAmtRaw = Number(getCol('OUT', 'Out', 'Creator Cost', 'Influencer Price')) || 0;

    const { moneyReceivedBy, paymentDoneBy } = parseAccountOwnerDetails(remarkRaw, inAmtRaw, outAmtRaw);

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
    let finalStatus: 'Pending' | 'In Discussion' | 'Parcel Sent' | 'Under Review' | 'Completed' | 'Settled' | 'Approved' = 'Pending';
    const lowerStat = statusRaw.toLowerCase();
    if (lowerStat.includes('completed') || lowerStat.includes('done')) finalStatus = 'Completed';
    else if (lowerStat.includes('approved')) finalStatus = 'Approved';
    else if (lowerStat.includes('settle')) finalStatus = 'Settled';
    else if (lowerStat.includes('review')) finalStatus = 'Under Review';
    else if (lowerStat.includes('parcel') || lowerStat.includes('sent') || lowerStat.includes('dispatch')) finalStatus = 'Parcel Sent';
    else if (lowerStat.includes('discuss') || lowerStat.includes('talk') || lowerStat.includes('connect')) finalStatus = 'In Discussion';

    // Unique match query per sheet row to prevent collapsing multiple deals of the same brand or shared order ID
    let existing: any = null;
    existing = await Influencer.findOne({ category: 'Barter', sheetRowIndex: idx });
    if (!existing && orderId && !orderId.toLowerCase().includes('directly')) {
      existing = await Influencer.findOne({ category: 'Barter', orderId, brandName, productLink });
    }

    if (existing) {
      existing.influencerManager = managerName || existing.influencerManager;
      existing.brandManagerTeam = managerTeam || existing.brandManagerTeam;
      existing.productLink = productLink || existing.productLink;
      existing.videoType = videoType || existing.videoType;
      existing.videoDescription = videoDescription || existing.videoDescription;
      existing.refVideoLink = refVideoLink || existing.refVideoLink;
      if (parsedRowDate) existing.orderDate = parsedRowDate;
      if (parsedRowDate) existing.transactionDate = parsedRowDate;

      // PRESERVE PANEL STATUS: If team member updated status in our panel (e.g. Completed, Under Review, Settled), DO NOT overwrite back to Pending unless Google Sheet explicitly specifies "Done" or "Completed"
      if (finalStatus === 'Completed' || finalStatus === 'Approved') {
        existing.status = finalStatus;
        existing.isApproved = true;
      } else if (!existing.status || existing.status === 'Pending') {
        existing.status = finalStatus;
      }

      // PRESERVE CREATOR HANDLE: If team member entered a real Instagram handle or custom creator name, KEEP IT!
      if (cleanInfName && !cleanInfName.endsWith('Creator') && !cleanInfName.startsWith('Creator #')) {
        existing.influencerName = cleanInfName;
        if (instaId) existing.influencerInstagramId = instaId;
      }

      if (contentLink) existing.contentLink = contentLink;
      if (adsCode) existing.adsCode = adsCode;
      if (reason) existing.reason = reason;
      if (moneyReceivedBy) existing.moneyReceivedBy = moneyReceivedBy;
      if (paymentDoneBy) existing.paymentDoneBy = paymentDoneBy;
      if (remarkRaw) existing.remark = remarkRaw;
      existing.sheetRowIndex = idx;

      await existing.save();
      syncedDocIds.push(existing._id);
      syncedCount++;
    } else {
      const count = await Influencer.countDocuments();
      const created = await Influencer.create({
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
        moneyReceivedBy,
        paymentDoneBy,
        remark: remarkRaw,
        sheetRowIndex: idx,
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
      syncedDocIds.push(created._id);
      syncedCount++;
    }
  }

  // Automatically remove older / dummy Barter records that do not exist in the Google Sheet
  if (syncedDocIds.length > 0) {
    const deleteResult = await Influencer.deleteMany({
      category: 'Barter',
      _id: { $nin: syncedDocIds }
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`[GoogleSheetSync] 🧹 Cleaned up ${deleteResult.deletedCount} old/unmatched Barter records.`);
    }
  }

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
    const FULL_VERIFIED_URL = 'https://script.google.com/macros/s/AKfycbwNv3pDStT-kRQ4zlQ9bB0snEfxqgZ--6BNarou3RNR3KWY6qebp4Uq94jerw7_5xJHaw/exec';
    const defaultUrl = process.env.GOOGLE_SHEET_BARTER_URL || process.env.GOOGLE_SCRIPT_URL || process.env.GOOGLE_SHEET_CSV_URL || FULL_VERIFIED_URL;

    if (!config) {
      config = await GoogleSheetConfig.create({
        sheetUrl: defaultUrl,
        autoSyncEnabled: true,
        syncIntervalSeconds: 60,
        lastSyncStatus: 'IDLE'
      });
    }

    // Auto-Fix: Overwrite broken/truncated URL (e.g. AKfycbzAbg) or docs.google.com link with verified full Apps Script URL
    if (!config.sheetUrl || config.sheetUrl.includes('AKfycbzAbg') || config.sheetUrl.length < 50 || config.sheetUrl.includes('docs.google.com')) {
      console.log('[GoogleSheetSync] Auto-correcting database sheetUrl to verified Google Script Web App URL...');
      config.sheetUrl = defaultUrl.length > 50 ? defaultUrl : FULL_VERIFIED_URL;
      await config.save();
    }

    const targetUrl = (config && config.sheetUrl && config.sheetUrl.trim().length > 40 && !config.sheetUrl.includes('AKfycbzAbg'))
      ? config.sheetUrl.trim()
      : FULL_VERIFIED_URL;

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
