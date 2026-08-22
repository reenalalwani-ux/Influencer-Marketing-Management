import dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { connectDB } from '../config/db';
import { Influencer, Brand, Target, User, Employee } from '../models/allModels';

function toBool(val: any): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'y' || lower === 'received';
  }
  if (typeof val === 'number') return val === 1;
  return false;
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
  if (!str.startsWith('http') && str.length < 35 && !str.includes('/') && !str.includes('?') && !str.includes('=')) {
    return str.startsWith('@') ? str : '@' + str;
  }
  return '';
}

function parseDateStr(str: any): Date | null {
  if (!str) return null;
  if (str instanceof Date && !isNaN(str.getTime())) {
    // Return with noon UTC to prevent timezone shifts
    return new Date(Date.UTC(str.getFullYear(), str.getMonth(), str.getDate(), 12, 0, 0));
  }
  const s = String(str).trim();
  
  // Format DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/.test(s)) {
    const parts = s.split(/[\/\-\.]/);
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2].slice(0, 4), 10);
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  
  // Format like "8 August 2026" or "08-Aug-2026" or "2026-08-08"
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0));
  }
  return null;
}

async function ensureBrand(brandName: string, managerName?: string): Promise<void> {
  if (!brandName?.trim()) return;
  const cleanName = brandName.trim();
  const existing = await Brand.findOne({
    brandName: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
  });
  if (!existing) {
    const safeName = cleanName.toUpperCase().replace(/\s+/g, '-').substring(0, 10);
    const brandId = `BR-${safeName}-${Date.now().toString().slice(-4)}`;
    await Brand.create({
      brandId,
      brandName: cleanName,
      industry: 'Fashion & Apparel',
      contactPerson: managerName || 'Brand Operations',
      email: `contact@${safeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '0000000000',
      status: 'Active',
    });
    console.log(`  ➕ Created Brand: ${cleanName}`);
  }
}

async function importAugustBarterOnly() {
  await connectDB();
  console.log('\n🚀 Starting Strict August 2026 Barter Collaborations Import...\n');

  const downloadsDir = 'C:\\Users\\Reena Lalwani\\Downloads';
  const onboardingFiles = fs.readdirSync(downloadsDir)
    .filter(f => f.toLowerCase().includes('onboarding') && f.endsWith('.xlsx'))
    .map(f => ({ name: f, fullPath: path.join(downloadsDir, f), mtime: fs.statSync(path.join(downloadsDir, f)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  const filePath = onboardingFiles.length > 0 ? onboardingFiles[0].fullPath : path.join(downloadsDir, 'Ad2Ship_Onboarding.xlsx');
  console.log(`📁 Source Sheet: ${filePath}`);

  // 1. CLEAR ALL BARTER RECORDS
  console.log('🧹 Clearing all existing Barter Collaborations from database...');
  const delResult = await Influencer.deleteMany({ category: 'Barter' });
  console.log(`  ✅ Removed ${delResult.deletedCount} old Barter records.\n`);

  // 2. READ EXCEL SHEET (raw: false for exact text strings)
  const wb = XLSX.readFile(filePath, { cellDates: false });
  const sheet = wb.Sheets['Influencer markerting'] || wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  console.log(`📂 Processing "Influencer markerting" (${rows.length} total rows)...`);

  // Fetch registered users and employees to validate Assignee
  const registeredUsers = await User.find({}, 'name email').lean();
  const registeredEmployees = await Employee.find({}, 'name email').lean();

  const validMemberNames = Array.from(new Set([
    ...registeredUsers.map((u: any) => (u.name || '').trim()),
    ...registeredEmployees.map((e: any) => (e.name || '').trim())
  ])).filter(name => name.length > 0);

  let sNoCounter = 1;
  let augustCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const rawBrand = (r[2] || '').toString().trim();
    const catVal   = (r[6] || '').toString().trim();
    const infLink  = (r[16] || r[14] || '').toString().trim();
    const pLink    = (r[7] || '').toString().trim();

    if (!rawBrand && !infLink && !pLink) continue;
    if (rawBrand.toLowerCase().includes('total') || rawBrand.toLowerCase().includes('grand')) continue;

    const isBarter = /barter/i.test(catVal);
    if (!isBarter) continue;

    // Parse primary date from column 0 (e.g. "21/08/2026") or column 12
    const d0 = parseDateStr(r[0]);
    const d12 = parseDateStr(r[12]);
    const primaryDate = d0 || d12;

    if (!primaryDate) continue;

    // STRICT AUGUST 2026 FILTER ONLY (Month index 7 = August)
    if (primaryDate.getUTCFullYear() !== 2026 || primaryDate.getUTCMonth() !== 7) {
      continue;
    }

    let infName = parseInstagramHandle(r[16]) || parseInstagramHandle(r[14]);
    if (!infName) {
      if (r[16] && !r[16].toString().startsWith('http')) {
        infName = r[16].toString().trim();
      } else {
        infName = `${rawBrand || 'Creator'} (Barter)`;
      }
    }

    // Match Assignee (r[5]), Brand Manager (r[3]), or Team (r[4]) against registered panel members
    const rawAssignee = (r[5] || r[3] || r[4] || '').toString().trim();
    let matchedManager = '';

    if (rawAssignee) {
      const cleanCand = rawAssignee.toLowerCase();
      const found = validMemberNames.find(m => {
        const lowM = m.toLowerCase();
        return lowM === cleanCand || lowM.split(' ')[0] === cleanCand || cleanCand.split(' ')[0] === lowM;
      });
      if (found) matchedManager = found;
    }

    const manager = matchedManager; // Leave BLANK if not a registered panel member!

    await ensureBrand(rawBrand, manager);

    // Map status strictly according to Column N (STATUS: "Pending" or "Done")
    const rawStatus = (r[13] || '').toString().trim().toLowerCase();
    let statusVal: 'Pending' | 'Completed' | 'Approved' = 'Pending';
    if (rawStatus.includes('done') || rawStatus.includes('completed')) {
      statusVal = 'Completed';
    } else if (rawStatus.includes('approved')) {
      statusVal = 'Approved';
    } else {
      statusVal = 'Pending';
    }

    const isAppr = statusVal === 'Completed' || statusVal === 'Approved';

    await Influencer.create({
      sNo: sNoCounter++,
      transactionDate: primaryDate,
      influencerManager: manager,
      brandName: rawBrand || 'General',
      influencerName: infName,
      profileLink: r[16] ? String(r[16]).trim() : '',
      category: 'Barter',

      brandOnboardingAmt: 0,
      brandReceivedAmt: 0,
      brandPendingAmt: 0,
      influencerOnboardingAmt: 0,
      influencerPaidAmt: 0,
      influencerPendingAmt: 0,
      ad2shipMargin: 0,
      inAmount: 0,
      outAmount: 0,
      balance: 0,
      finalPaymentReceived: false,

      productLink: pLink,
      videoType: r[8] ? String(r[8]).trim() : 'Single Product Video',
      videoDescription: r[9] ? String(r[9]).trim() : '',
      refVideoLink: r[10] ? String(r[10]).trim() : '',
      orderId: r[11] ? String(r[11]).trim() : '',
      orderDate: d12 || undefined,
      status: statusVal,
      contentLink: r[14] ? String(r[14]).trim() : '',
      adsCode: r[15] ? String(r[15]).trim() : '',
      isApproved: isAppr,
      remark: r[19] || r[18] ? String(r[19] || r[18]).trim() : '',
      notes: r[18] ? String(r[18]).trim() : '',
      platform: 'Instagram'
    });

    augustCount++;
  }

  console.log(`\n🎉 Import Completed:`);
  console.log(`   ✅ August 2026 Barters Imported: ${augustCount}`);

  // 3. TARGET SYNC
  console.log('\n🔄 Syncing August 2026 Barter Targets...');
  const targets = await Target.find({ status: 'Active', targetType: 'Barter' });
  for (const target of targets) {
    const startDate = target.startDate || new Date(Date.UTC(2026, 7, 1, 0, 0, 0));
    const endDate = target.endDate || new Date(Date.UTC(2026, 7, 31, 23, 59, 59));

    const count = await Influencer.countDocuments({
      category: 'Barter',
      transactionDate: { $gte: startDate, $lte: endDate }
    });
    target.achievedCount = count;
    target.achievedAmount = count;
    await target.save();
    console.log(`   🎯 Updated Target "${target.title}": ${count} barter deals achieved.`);
  }

  console.log('\n✨ All operations completed successfully!\n');
  process.exit(0);
}

importAugustBarterOnly().catch(err => {
  console.error('❌ Error during import:', err);
  process.exit(1);
});
