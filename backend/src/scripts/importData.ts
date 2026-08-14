import dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { connectDB } from '../config/db';
import { Influencer, Brand, PaymentLog, Target } from '../models/allModels';

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

function parseDayNumber(val: any): number {
  if (!val) return 15;
  if (typeof val === 'number') {
    const ms = (val - 25569) * 86400 * 1000;
    const d = new Date(ms);
    return isNaN(d.getDate()) ? 15 : d.getDate();
  }
  const str = String(val).trim();
  const parts = str.split(/[\/\-\.]/);
  if (parts.length >= 1) {
    const day = parseInt(parts[0], 10);
    if (!isNaN(day) && day >= 1 && day <= 31) return day;
  }
  return 15;
}

function toNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function parseInstagramHandle(urlOrText: any): string {
  if (!urlOrText) return '';
  const str = String(urlOrText).trim();
  if (str.includes('instagram.com/')) {
    const parts = str.split('instagram.com/')[1].split('/')[0].split('?')[0];
    if (parts && parts !== 'reel' && parts !== 'p' && parts !== 'reels') {
      return '@' + parts;
    }
  }
  if (!str.startsWith('http') && str.length < 30 && !str.includes('/') && !str.includes('.')) {
    return str.startsWith('@') ? str : '@' + str;
  }
  return '';
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
      industry: 'General',
      contactPerson: managerName || 'To be updated',
      email: `contact@${safeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '0000000000',
      status: 'Active',
    });
  }
}

async function triggerTargetSync() {
  try {
    const targets = await Target.find({ status: 'Active', autoSync: true });
    for (const target of targets) {
      const now = new Date();
      const startDate = target.startDate || new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const endDate = target.endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      if (target.targetType === 'Barter') {
        const count = await Influencer.countDocuments({
          category: 'Barter',
          transactionDate: { $gte: startDate, $lte: endDate }
        });
        target.achievedCount = count;
        target.achievedAmount = count;
      } else {
        const paidRecords = await Influencer.find({
          category: 'Paid',
          transactionDate: { $gte: startDate, $lte: endDate }
        });
        target.achievedAmount = paidRecords.reduce((acc, curr) => acc + (curr.ad2shipMargin || 0), 0);
      }
      await target.save();
    }
  } catch (err) {
    console.error('Target sync error:', err);
  }
}

// ─────────────────────────────────────────────────────────────────
//  MAIN IMPORT FUNCTION
// ─────────────────────────────────────────────────────────────────
async function importData() {
  await connectDB();
  console.log('\n🚀 Starting Strict Month-Mapped Data Import...\n');

  const importsDir = path.join(__dirname, '../../imports');
  if (!fs.existsSync(importsDir)) {
    console.error(`❌ Imports directory not found at: ${importsDir}`);
    process.exit(1);
  }

  // 1. WIPE OLD COLLECTIONS
  console.log('🧹 Clearing old Influencer & PaymentLog collections...');
  await Influencer.deleteMany({});
  await PaymentLog.deleteMany({});
  console.log('  ✅ Old collections cleared.\n');

  let sNoCounter = 1;
  let totalBarter = 0;
  let totalPaid = 0;
  let totalPaymentLogs = 0;

  // ─────────────────────────────────────────────────────────────────
  //  STEP 1: Import Month Sheets (June month, July month, August month)
  //  These files represent the Paid Collaborations for June, July, August!
  // ─────────────────────────────────────────────────────────────────
  const monthConfigs = [
    { filename: 'June month.xlsx', monthIndex: 5, monthTag: 'June' },    // June 2026 (index 5)
    { filename: 'July month.xlsx', monthIndex: 6, monthTag: 'July' },    // July 2026 (index 6)
    { filename: 'August month.xlsx', monthIndex: 7, monthTag: 'August' } // August 2026 (index 7)
  ];

  for (const cfg of monthConfigs) {
    const mPath = path.join(importsDir, cfg.filename);
    if (!fs.existsSync(mPath)) continue;

    console.log(`📂 Processing "${cfg.filename}" (${cfg.monthTag} 2026 Paid Collaborations & Payment Logs)...`);
    const wb = XLSX.readFile(mPath, { cellDates: true });
    const sheet = wb.Sheets['Sheet1'] || wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let countPaid = 0;
    let countLogs = 0;

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const rawDate = r[1];
      const desc    = (r[2] || '').toString().trim();
      const inAmt   = toNumber(r[3]);
      const outAmt  = toNumber(r[4]);
      const balance = toNumber(r[5]);
      const owner   = (r[6] || '').toString().trim();

      if (!desc && inAmt === 0 && outAmt === 0) continue;
      if (desc.toLowerCase().includes('total') || desc.toLowerCase().includes('balance')) continue;

      // Assign date in the exact month of the sheet file
      const dayNum = parseDayNumber(rawDate);
      const maxDays = new Date(2026, cfg.monthIndex + 1, 0).getDate();
      const validDay = Math.min(maxDays, Math.max(1, dayNum));
      const tDate = new Date(2026, cfg.monthIndex, validDay);

      await ensureBrand(desc, owner || 'yash');

      // Create Payment Audit Log
      await PaymentLog.create({
        influencerName: desc,
        brandName: desc,
        type: inAmt > 0 ? 'IN' : 'OUT',
        amount: inAmt > 0 ? inAmt : outAmt,
        inAmount: inAmt,
        outAmount: outAmt,
        balance: balance,
        month: cfg.monthTag,
        paymentDate: tDate,
        paymentMode: 'Bank Transfer',
        notes: owner,
        transactionDate: tDate,
      });
      countLogs++;
      totalPaymentLogs++;

      // Create Paid Collaboration Record
      await Influencer.create({
        sNo: sNoCounter++,
        transactionDate: tDate,
        influencerManager: owner && !owner.toLowerCase().includes('paid') ? owner : 'yash',
        brandName: desc,
        influencerName: desc,
        phone: '',
        profileLink: '',
        category: 'Paid',

        brandOnboardingAmt: inAmt,
        brandReceivedAmt: inAmt,
        brandPendingAmt: 0,
        influencerOnboardingAmt: outAmt,
        influencerPaidAmt: outAmt,
        influencerPendingAmt: 0,
        ad2shipMargin: inAmt - outAmt,
        inAmount: inAmt,
        outAmount: outAmt,
        balance: inAmt - outAmt,
        finalPaymentReceived: true,

        productLink: '',
        videoType: 'Single Product Video',
        status: 'Completed',
        isApproved: true,
        remark: owner,
        platform: 'Instagram'
      });
      countPaid++;
      totalPaid++;
    }
    console.log(`   ✅ ${cfg.filename}: ${countPaid} Paid Collab records created for ${cfg.monthTag} 2026.`);
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 2: Import PAID PATERNSHIP (INFLUENCER MARKETING).xlsx for March, April, May
  // ─────────────────────────────────────────────────────────────────
  const paidPath = path.join(importsDir, 'PAID PATERNSHIP (INFLUENCER MARKETING).xlsx');
  if (fs.existsSync(paidPath)) {
    console.log('\n📂 Processing "PAID PATERNSHIP (INFLUENCER MARKETING).xlsx" for initial Paid Collabs...');
    const wb = XLSX.readFile(paidPath, { cellDates: true });
    const sheet = wb.Sheets['Sheet1'] || wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let initialCount = 0;
    for (let i = 2; i < Math.min(12, rows.length); i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;

      const manager  = (r[2] || '').toString().trim();
      const brand    = (r[3] || '').toString().trim();
      const infName  = (r[4] || '').toString().trim();
      const phone    = (r[5] || '').toString().trim();
      const profile  = (r[6] || '').toString().trim();

      const bAmt     = toNumber(r[7]);
      const bRecv    = toNumber(r[8]);
      const bPend    = toNumber(r[9]) || (bAmt - bRecv);

      const infAmt   = toNumber(r[10]);
      const infPaid  = toNumber(r[11]);
      const infPend  = toNumber(r[12]) || (infAmt - infPaid);

      const margin   = toNumber(r[13]) || (bAmt - infAmt);
      const isFinal  = toBool(r[14]);
      const pLinks   = (r[15] || '').toString().trim();
      const remark   = (r[17] || '').toString().trim();

      if (bAmt === 0 && bRecv === 0 && infAmt === 0 && !manager) continue;
      if (!brand && !infName) continue;

      // Assign initial dates in May 2026 (index 4)
      const dayNum = parseDayNumber(r[16]);
      const tDate = new Date(2026, 4, Math.min(31, Math.max(1, dayNum)));

      await ensureBrand(brand, manager);

      await Influencer.create({
        sNo: sNoCounter++,
        transactionDate: tDate,
        influencerManager: manager || 'yash',
        brandName: brand || 'General',
        influencerName: infName || 'Creator',
        phone: phone ? String(phone) : '',
        profileLink: profile,
        category: 'Paid',

        brandOnboardingAmt: bAmt,
        brandReceivedAmt: bRecv,
        brandPendingAmt: bPend,
        influencerOnboardingAmt: infAmt,
        influencerPaidAmt: infPaid,
        influencerPendingAmt: infPend,
        ad2shipMargin: margin,
        inAmount: bRecv,
        outAmount: infPaid,
        balance: bRecv - infPaid,
        finalPaymentReceived: isFinal,

        productLink: pLinks,
        videoType: 'Single Product Video',
        status: isFinal ? 'Completed' : 'Pending',
        isApproved: true,
        remark: remark,
        platform: 'Instagram'
      });

      initialCount++;
      totalPaid++;
    }
    console.log(`   ✅ PAID PATERNSHIP imported: ${initialCount} initial Paid records created for May 2026.`);
  }

  // ─────────────────────────────────────────────────────────────────
  //  STEP 3: Import Ad2Ship_Onboarding.xlsx (Barter Collaborations)
  // ─────────────────────────────────────────────────────────────────
  const onboardingPath = path.join(importsDir, 'Ad2Ship_Onboarding.xlsx');
  if (fs.existsSync(onboardingPath)) {
    console.log('\n📂 Processing "Ad2Ship_Onboarding.xlsx" (Barter Collaborations)...');
    const wb = XLSX.readFile(onboardingPath, { cellDates: true });
    const sheet = wb.Sheets['Sheet1'] || wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

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

      if (isBarter) {
        let infName = parseInstagramHandle(r[16]) || parseInstagramHandle(r[14]);
        if (!infName) {
          if (r[16] && !r[16].toString().startsWith('http')) {
            infName = r[16].toString().trim();
          } else {
            infName = `${rawBrand || 'Creator'} (Barter)`;
          }
        }

        // Distribute Barter transaction dates across May, June, July, August 2026
        const dayNum = (i % 28) + 1;
        const monthIndices = [4, 5, 6, 7]; // May, June, July, August
        const mIdx = monthIndices[i % 4];
        const dateVal = new Date(2026, mIdx, dayNum);

        await ensureBrand(rawBrand, r[3] || r[5]);

        await Influencer.create({
          sNo: sNoCounter++,
          transactionDate: dateVal,
          influencerManager: (r[5] || r[3] || 'Staff').toString().trim(),
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
          status: r[13] ? (String(r[13]).toLowerCase().includes('appr') ? 'Approved' : 'Completed') : 'Completed',
          contentLink: r[14] ? String(r[14]).trim() : '',
          adsCode: r[15] ? String(r[15]).trim() : '',
          isApproved: toBool(r[17]),
          remark: r[18] ? String(r[18]).trim() : '',
          notes: r[19] ? String(r[19]).trim() : '',
          platform: 'Instagram'
        });

        totalBarter++;
      }
    }
    console.log(`   ✅ Ad2Ship_Onboarding.xlsx imported: ${totalBarter} Barter records.`);
  }

  await triggerTargetSync();

  console.log('\n=======================================================');
  console.log('✨ STRICT MONTH-MAPPED DATA IMPORT SUCCESSFUL!');
  console.log(`   💰 Paid Collaborations : ${totalPaid}`);
  console.log(`   🏷️  Barter Collaborations : ${totalBarter}`);
  console.log(`   📊 Total Payment Audit Logs: ${totalPaymentLogs}`);
  console.log('=======================================================\n');

  process.exit(0);
}

importData().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
