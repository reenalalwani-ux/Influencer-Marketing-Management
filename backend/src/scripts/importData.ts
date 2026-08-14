import dotenv from 'dotenv';
dotenv.config();

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { connectDB } from '../config/db';
import { Influencer, Brand, PaymentLog } from '../models/allModels';

// ─────────────────────────────────────────────────────────────────
//  INFLUENCER COLUMN TRANSLATION MAP
//  Maps Excel column headers → MongoDB Influencer field names
// ─────────────────────────────────────────────────────────────────
const INFLUENCER_COL_MAP: Record<string, string> = {
  'S NO':                         'sNo',
  'S.NO':                         'sNo',
  'SNO':                          'sNo',
  'INFLUENCER MA':                'influencerManager',
  'INFLUENCER MANAGER':           'influencerManager',
  'Influencer Manager':           'influencerManager',
  'BRAND NAME':                   'brandName',
  'Brand Name':                   'brandName',
  'brand name':                   'brandName',
  'INFLUENCER NAME':              'influencerName',
  'Influencer Name':              'influencerName',
  'INFLUENCER':                   'influencerName',
  'PHONE NO.':                    'phone',
  'PHONE NO':                     'phone',
  'Phone No':                     'phone',
  'Phone':                        'phone',
  'PROFILE LINK':                 'profileLink',
  'Profile Link':                 'profileLink',
  'Influencers id':               'profileLink',
  // Financial
  'Brand Onboarding Amt':         'brandOnboardingAmt',
  'BRAND ONBOARDING AMT':         'brandOnboardingAmt',
  'Received':                     'brandReceivedAmt',
  'RECEIVED':                     'brandReceivedAmt',
  'Pending':                      '_brandPendingExcel',   // will be auto-calculated
  'PENDING':                      '_brandPendingExcel',
  'Influncer Onboarding / Paid':  'influencerOnboardingAmt',
  'Influncer Onbording amt':      'influencerOnboardingAmt',
  'Brand Onbording Amt':          'brandOnboardingAmt',   // typo variant in file
  'Influencer Onboarding':        'influencerOnboardingAmt',
  'Influencer Onboarding / Paid': 'influencerOnboardingAmt',
  'INFLUENCER ONBOARDING':        'influencerOnboardingAmt',
  'Paid':                         'influencerPaidAmt',
  'Influencer Paid':              'influencerPaidAmt',
  'INFLUENCER PAID':              'influencerPaidAmt',
  'INFLUENCER MARKETER POC':      'influencerManager',
  'Influencer Marketer POC':      'influencerManager',
  'AD2SHIP Margin':               '_marginExcel',         // will be auto-calculated
  'AD2SHIP MARGIN':               '_marginExcel',
  'FINAL PAYMENT RECIVED':        'finalPaymentReceived',
  'FINAL PAYMENT RECEIVED':       'finalPaymentReceived',
  'Final Payment Received':       'finalPaymentReceived',
  // Content & Deliverables
  'PRODUCT LINKS':                'productLink',
  'PRODUCT LINK':                 'productLink',
  'Product Link':                 'productLink',
  'Type of Video':                'videoType',
  'TYPE OF VIDEO':                'videoType',
  'video description':            'videoDescription',
  'Video Description':            'videoDescription',
  'REFRENCE VIDEO LINK':          'refVideoLink',
  'Reference Video Link':         'refVideoLink',
  'Order ID':                     'orderId',
  'ORDER ID':                     'orderId',
  'Order date':                   'orderDate',
  'Order Date':                   'orderDate',
  'ORDER DATE':                   'orderDate',
  'DATE':                         'transactionDate',
  'Date':                         'transactionDate',
  // Onboarding extra fields
  'BRAND MANAGER':                'influencerManager',
  'Brand Manager':                'influencerManager',
  'Brand Manager Team':           'brandManagerTeam',
  'BRAND MANAGER TEAM':           'brandManagerTeam',
  'Assigne':                      'assignedExecutive',
  'Assigned':                     'assignedExecutive',
  'Column 20':                    'influencerName',
  // Status
  'STATUS':                       'status',
  'Status':                       'status',
  'CONTENT LINK':                 'contentLink',
  'Content Link':                 'contentLink',
  'ADS CODE':                     'adsCode',
  'Ads Code':                     'adsCode',
  'Approved or not':              'isApproved',
  'APPROVED OR NOT':              'isApproved',
  // Notes
  'REMARKS':                      'remark',
  'Remarks':                      'remark',
  'REMARK':                       'remark',
  'Remark':                       'remark',
  'Reason':                       'remark',
  'Other remark':                 'notes',
  'Other Remark':                 'notes',
  'Notes':                        'notes',
};

// ─────────────────────────────────────────────────────────────────
//  PAYMENT LEDGER COLUMN MAP (June/July/August month sheets)
//  Columns: DATE, DESCRIPTION, IN, OUT, BALANCE, REMARK/ACCOUNT OWNER NAME
// ─────────────────────────────────────────────────────────────────
const PAYMENT_COL_MAP: Record<string, string> = {
  'DATE':                         'date',
  'Date':                         'date',
  'DESCRIPTION':                  'description',
  'Description':                  'description',
  'IN':                           'in',
  'In':                           'in',
  'OUT':                          'out',
  'Out':                          'out',
  'BALANCE':                      '_balanceExcel',        // will be auto-calculated
  'Balance':                      '_balanceExcel',
  'REMARK/ACCOUNT OWNER NAME':    'accountOwner',
  'Remark/Account Owner Name':    'accountOwner',
  'REMARK':                       'accountOwner',
  'Account Owner':                'accountOwner',
};

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y' || lower === 'received';
  }
  if (typeof val === 'number') return val === 1;
  return false;
}

function toDate(val: any): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel serial date → JS Date
    const ms = (val - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

function toNumber(val: any): number {
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function translateRow(
  rawRow: Record<string, any>,
  colMap: Record<string, string>
): Record<string, any> {
  const translated: Record<string, any> = {};
  for (const [excelKey, value] of Object.entries(rawRow)) {
    const trimmedKey = excelKey.trim();
    const dbKey = colMap[trimmedKey] || colMap[excelKey];
    if (dbKey) {
      translated[dbKey] = value;
    } else if (Object.values(colMap).includes(trimmedKey)) {
      // Already a DB field name
      translated[trimmedKey] = value;
    }
  }
  return translated;
}

// Detect sheet type from its header row
function detectSheetType(headers: string[]): 'influencer' | 'payment' | 'unknown' {
  const h = headers.map(s => s?.toString().trim().toUpperCase());
  if (h.some(k =>
    k.includes('INFLUENCER NAME') ||
    k.includes('BRAND NAME') ||
    k.includes('INFLUENCER MA') ||
    k.includes('INFLUENCER MARKETER') ||
    k.includes('BRAND ONBO') ||
    k.includes('INFLUNCER')
  )) {
    return 'influencer';
  }
  if (h.some(k => k === 'IN' || k === 'OUT' || k === 'BALANCE') && h.some(k => k === 'DATE' || k === 'DESCRIPTION')) {
    return 'payment';
  }
  return 'unknown';
}

// Read sheet rows, auto-detecting if header is on row 1 or row 2
function readSheetRows(sheet: XLSX.WorkSheet): Record<string, any>[] {
  // Try row 1 as header first
  const rows1: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
  if (rows1.length > 0) {
    const headers1 = Object.keys(rows1[0]);
    const type1 = detectSheetType(headers1);
    if (type1 !== 'unknown') return rows1;
  }

  // Try row 2 as header (skip first blank/title row)
  const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, header: 1 }) as any[][];
  if (allRows.length >= 2) {
    const headerRow = allRows[1] as string[];
    const dataRows = allRows.slice(2);
    return dataRows.map(row => {
      const obj: Record<string, any> = {};
      headerRow.forEach((key, i) => {
        if (key) obj[key.toString().trim()] = row[i] ?? '';
      });
      return obj;
    });
  }

  return rows1;
}

// ─────────────────────────────────────────────────────────────────
//  AUTO-CREATE BRAND
// ─────────────────────────────────────────────────────────────────
async function ensureBrand(brandName: string, managerName?: string): Promise<void> {
  if (!brandName?.trim()) return;
  const existing = await Brand.findOne({
    brandName: { $regex: new RegExp(`^${brandName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  if (!existing) {
    const safeName = brandName.trim().toUpperCase().replace(/\s+/g, '-').substring(0, 10);
    const brandId = `BR-${safeName}-${Date.now().toString().slice(-4)}`;
    await Brand.create({
      brandId,
      brandName: brandName.trim(),
      industry: 'General',
      contactPerson: managerName || 'To be updated',
      email: `contact@${safeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '0000000000',
      status: 'Active',
    });
    console.log(`     🏷️  Auto-created Brand: "${brandName.trim()}"`);
  }
}

// ─────────────────────────────────────────────────────────────────
//  IMPORT INFLUENCER SHEET
// ─────────────────────────────────────────────────────────────────
async function importInfluencerSheet(
  rawRows: Record<string, any>[],
  sheetName: string
): Promise<{ imported: number; skipped: number; brandsCreated: number }> {
  let imported = 0, skipped = 0, brandsCreated = 0;
  const brandsBefore = await Brand.countDocuments();

  let lastBrandName = '';  // Carry-forward for grouped brand sections

  for (const rawRow of rawRows) {
    const row = translateRow(rawRow, INFLUENCER_COL_MAP);

    // ── SMART ROW FILTERS ── skip non-data rows
    let rawBrand = (row.brandName || '').toString().trim();
    let rawInf   = (row.influencerName || '').toString().trim();
    const rawSno = (row.sNo || '').toString().trim();

    // Skip if both brand and influencer are missing
    if (!rawBrand && !rawInf) { skipped++; continue; }

    // Skip if influencer name is actually a URL
    if (rawInf.startsWith('http') || rawInf.startsWith('www.')) { skipped++; continue; }

    // Skip if brand name is a phone number (all digits)
    if (/^\d{7,15}$/.test(rawBrand)) { skipped++; continue; }

    // Skip if influencer name is a phone number
    if (/^\d{7,15}$/.test(rawInf)) { skipped++; continue; }

    // Skip section/month header rows where sNo is text
    if (rawSno && isNaN(Number(rawSno)) && rawSno.length > 1) { skipped++; continue; }

    // Skip rows where brand/influencer is a month or total label
    const monthOrTotalWords = /^(june|july|august|september|october|november|december|january|february|march|april|may|total|sub.?total|grand.?total|s\.?\s*no|sno)/i;
    if (monthOrTotalWords.test(rawBrand) || monthOrTotalWords.test(rawInf)) { skipped++; continue; }

    // ── BRAND CARRY-FORWARD LOGIC ──
    // Case 1: Brand name is present → update lastBrandName
    if (rawBrand && rawInf) {
      lastBrandName = rawBrand;
    }
    // Case 2: Brand name is empty, influencer name has value that looks like a brand header
    // (no financial data, no phone — it's a section title row placed in influencer column)
    else if (!rawBrand && rawInf) {
      const hasFinancial = toNumber(row.brandOnboardingAmt) > 0 || toNumber(row.influencerOnboardingAmt) > 0;
      const hasPhone     = !!(row.phone || '').toString().trim();
      const hasProfile   = !!(row.profileLink || '').toString().trim();

      if (!hasFinancial && !hasPhone && !hasProfile) {
        // This row is a brand section header (brand name in wrong column)
        lastBrandName = rawInf;
        skipped++;
        continue;
      }
      // Otherwise: it's a real data row — apply carry-forward brand
      if (lastBrandName) {
        rawBrand = lastBrandName;
        row.brandName = lastBrandName;
      } else {
        skipped++;
        continue;
      }
    }

    // Auto-create brand
    if (row.brandName) {
      await ensureBrand(row.brandName, row.influencerManager);
    }


    // ── AUTO-CALCULATIONS ──
    const brandAmt      = toNumber(row.brandOnboardingAmt);
    const brandReceived = toNumber(row.brandReceivedAmt);
    const infAmt        = toNumber(row.influencerOnboardingAmt);
    const infPaid       = toNumber(row.influencerPaidAmt);

    row.brandOnboardingAmt    = brandAmt;
    row.brandReceivedAmt      = brandReceived;
    row.brandPendingAmt       = brandAmt - brandReceived;           // AUTO-CALCULATED
    row.influencerOnboardingAmt = infAmt;
    row.influencerPaidAmt     = infPaid;
    row.influencerPendingAmt  = infAmt - infPaid;                   // AUTO-CALCULATED
    row.ad2shipMargin         = brandAmt - infAmt;                  // AUTO-CALCULATED
    row.inAmount              = brandReceived;
    row.outAmount             = infPaid;
    row.balance               = brandReceived - infPaid;            // AUTO-CALCULATED

    // Remove Excel-computed placeholder fields
    delete row._brandPendingExcel;
    delete row._marginExcel;

    // Format booleans
    if (row.isApproved !== undefined)           row.isApproved = toBool(row.isApproved);
    if (row.finalPaymentReceived !== undefined)  row.finalPaymentReceived = toBool(row.finalPaymentReceived);

    // Format dates
    if (row.transactionDate) row.transactionDate = toDate(row.transactionDate);
    if (row.orderDate)        row.orderDate = toDate(row.orderDate);

    // Normalize status
    if (row.status) {
      const s = row.status.toString().toLowerCase();
      if (s === 'completed' || s === 'done')   row.status = 'Completed';
      else if (s === 'approved')               row.status = 'Approved';
      else if (s === 'settled')                row.status = 'Settled';
      else                                      row.status = 'Pending';
    } else {
      row.status = 'Pending';
    }

    // Defaults
    if (!row.platform)  row.platform = 'Instagram';
    if (!row.category)  row.category = 'Paid';

    // Month tag from sheet name (if June / July / August)
    const monthMatch = sheetName.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
    if (monthMatch && !row.remark) {
      row.remark = monthMatch[0];
    }

    try {
      await Influencer.create(row);
      imported++;
    } catch (err: any) {
      console.log(`     ⚠️  Skipped row (${row.influencerName || 'unknown'}): ${err.message}`);
      skipped++;
    }
  }

  brandsCreated = (await Brand.countDocuments()) - brandsBefore;
  return { imported, skipped, brandsCreated };
}

// ─────────────────────────────────────────────────────────────────
//  IMPORT PAYMENT LEDGER SHEET (June/July/August months)
//  Structure:
//    IN  row → DESCRIPTION = Brand Name  (money received FROM brand)
//    OUT row → DESCRIPTION = Influencer Name (money paid TO influencer)
//  BALANCE column is cumulative running total (overall)
// ─────────────────────────────────────────────────────────────────
async function importPaymentSheet(
  rawRows: Record<string, any>[],
  sheetName: string,
  fileName: string
): Promise<{ imported: number; skipped: number }> {
  let imported = 0, skipped = 0;
  let overallRunningBalance = 0;
  let lastBrandName = 'General';

  // Build per-brand balance tracker
  const brandBalance: Record<string, { in: number; out: number; balance: number }> = {};

  // Determine month tag from file name or sheet name
  const monthSource = sheetName + ' ' + fileName;
  const monthMatch = monthSource.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  const monthTag = monthMatch ? monthMatch[0].charAt(0).toUpperCase() + monthMatch[0].slice(1) : sheetName;

  for (const rawRow of rawRows) {
    const row = translateRow(rawRow, PAYMENT_COL_MAP);

    // Skip rows with no description and no amounts
    const inAmt  = toNumber(row.in);
    const outAmt = toNumber(row.out);
    const desc   = (row.description || '').toString().trim();

    if (!desc && inAmt === 0 && outAmt === 0) {
      skipped++;
      continue;
    }
    if (!desc) { skipped++; continue; }

    // Determine type and assign brand/influencer
    let brandName    = '';
    let influencerName = '';

    if (inAmt > 0) {
      // IN transaction → DESCRIPTION is the Brand Name
      brandName      = desc;
      influencerName = desc;   // stored as influencerName too for schema compliance
      lastBrandName  = desc;   // update carry-forward brand
    } else if (outAmt > 0) {
      // OUT transaction → DESCRIPTION is Influencer Name, brand = carry-forward
      influencerName = desc;
      brandName      = lastBrandName;  // carry forward last brand
    } else {
      skipped++;
      continue;
    }

    // Update per-brand tracker
    if (!brandBalance[brandName]) {
      brandBalance[brandName] = { in: 0, out: 0, balance: 0 };
    }
    brandBalance[brandName].in      += inAmt;
    brandBalance[brandName].out     += outAmt;
    brandBalance[brandName].balance  = brandBalance[brandName].in - brandBalance[brandName].out;

    // Update overall running balance
    overallRunningBalance = overallRunningBalance + inAmt - outAmt;

    const paymentDate = toDate(row.date) || new Date();

    try {
      await PaymentLog.create({
        influencerName,
        brandName,
        type:           inAmt > 0 ? 'IN' : 'OUT',
        amount:         inAmt > 0 ? inAmt : outAmt,
        inAmount:       inAmt,
        outAmount:      outAmt,
        balance:        brandBalance[brandName].balance,  // per-brand balance
        month:          monthTag,
        paymentDate,
        paymentMode:    'Bank Transfer',
        notes:          (row.accountOwner || '').toString().trim(),
        transactionDate: paymentDate,
      });
      imported++;
    } catch (err: any) {
      console.log(`     ⚠️  Skipped payment row (${desc}): ${err.message}`);
      skipped++;
    }
  }

  // Print per-brand summary
  console.log(`\n     📊 ${monthTag} Brand-wise Summary:`);
  for (const [brand, bal] of Object.entries(brandBalance)) {
    console.log(`        • ${brand}: IN=₹${bal.in.toLocaleString()} | OUT=₹${bal.out.toLocaleString()} | Balance=₹${bal.balance.toLocaleString()}`);
  }
  console.log(`        Overall Running Balance: ₹${overallRunningBalance.toLocaleString()}\n`);

  return { imported, skipped };
}


// ─────────────────────────────────────────────────────────────────
//  MAIN IMPORT RUNNER
// ─────────────────────────────────────────────────────────────────
async function importData() {
  await connectDB();
  console.log('\n🚀 Starting Data Import...\n');

  const importsDir = path.join(__dirname, '../../imports');
  const files = fs.readdirSync(importsDir).filter(f =>
    (f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv')) &&
    !f.startsWith('~$')   // Skip Excel temp lock files
  );

  if (files.length === 0) {
    console.log('❌ No Excel/CSV files found in backend/imports/ folder!');
    process.exit(1);
  }

  let grandTotalImported = 0;
  let grandTotalSkipped = 0;
  let grandBrandsCreated = 0;
  let grandPaymentsImported = 0;

  for (const file of files) {
    if (file === 'README.md') continue;

    const filePath = path.join(importsDir, file);
    console.log(`\n📂 File: "${file}"`);

    const workbook = XLSX.readFile(filePath, { cellDates: true });

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows: Record<string, any>[] = readSheetRows(sheet);

      if (rawRows.length === 0) {
        console.log(`  📄 Sheet "${sheetName}" — empty, skipping.`);
        continue;
      }

      // Detect sheet type from headers
      const headers = Object.keys(rawRows[0] || {});
      const sheetType = detectSheetType(headers);

      console.log(`  📄 Sheet: "${sheetName}" [${rawRows.length} rows] → Type: ${sheetType.toUpperCase()}`);

      if (sheetType === 'influencer') {
        const result = await importInfluencerSheet(rawRows, sheetName);
        console.log(`     ✅ Imported: ${result.imported} | Skipped: ${result.skipped} | Brands Created: ${result.brandsCreated}`);
        grandTotalImported += result.imported;
        grandTotalSkipped  += result.skipped;
        grandBrandsCreated += result.brandsCreated;

      } else if (sheetType === 'payment') {
        const result = await importPaymentSheet(rawRows, sheetName, file);
        console.log(`     💰 Payment Records Imported: ${result.imported} | Skipped: ${result.skipped}`);
        grandPaymentsImported += result.imported;
        grandTotalSkipped     += result.skipped;

      } else {
        console.log(`     ⚠️  Unknown sheet format — skipping.`);
      }
    }
  }

  console.log('\n=======================================================');
  console.log('✨ ALL IMPORTS COMPLETE!');
  console.log(`   ✅ Influencer Records Imported : ${grandTotalImported}`);
  console.log(`   💰 Payment Logs Imported       : ${grandPaymentsImported}`);
  console.log(`   🏷️  Brands Auto-Created         : ${grandBrandsCreated}`);
  console.log(`   ⚠️  Rows Skipped (blank/invalid): ${grandTotalSkipped}`);
  console.log('=======================================================\n');
  process.exit(0);
}

importData().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
