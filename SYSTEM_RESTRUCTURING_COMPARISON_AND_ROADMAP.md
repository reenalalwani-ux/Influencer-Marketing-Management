# Ad2ship Influencer Marketing Management System
## System Restructuring, Comparative Analysis & Implementation Roadmap

**Document Type:** Final Architecture Comparison, Restructuring Specification & Implementation Plan  
**Organization:** Ad2ship Operations  
**Date:** August 2026  
**Version:** 3.0 (Final Restructured Release)  
**Author:** Technical Architecture Team  

---

## 1. Executive Summary

This document presents the **complete architectural and operational transition** of the Ad2ship Influencer Marketing Management System. It formally captures:
1. **The Old System Architecture** (from the original `SCOPE_OF_DOCUMENT.md`).
2. **The New Restructuring Proposal** (from Harsh Jonwal's 10-page restructuring proposal).
3. **The Final Production Specification** incorporating all custom business rules:
   - 6-Member Team (Manasvi removed and her 11 brands redistributed).
   - Ad2ship Net Margin definition (`Brand Revenue − Influencer Payout`).
   - Two-tiered incentive slabs (**5% for ₹80k+**, **10% for ₹1L+ / ₹1.2L**).
   - Performance bonus (**10% for individual videos generating 100+ orders**).
4. **File-by-file technical modifications and a phased timeline.**

---

## 2. Comprehensive Comparison Matrix (Old vs. Proposal vs. Final)

```
┌───────────────────────────┬─────────────────────────────┬─────────────────────────────┬──────────────────────────────────────────┐
│ Feature / Area            │ 1. Old Scope Document       │ 2. Restructuring PDF        │ 3. Final Production Spec (With Add-ons)  │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Core Operational Model    │ Organic social media posting│ 100% Influencer Marketing   │ 100% Influencer Marketing                │
│                           │ (15 posts/month on IG pages)│ (Barter + Paid Collabs)     │ (Barter + Paid Collabs)                  │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Organic Content Workflows │ Daily Posting Matrix,       │ Discontinued with immediate │ Deprecated / Archived from main view     │
│                           │ 15-Day Graphic Calendars    │ effect across all brands    │                                          │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Team Size & Composition   │ Content + Influencer teams  │ 7 Members (incl. Manasvi)   │ 6 Members (Manasvi removed)              │
│                           │                             │                             │ (Ridhima, Kajal, Khushi, Gunjan,         │
│                           │                             │                             │  Bhawna, Nikita)                         │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Active Brand Portfolio    │ 112 uncurated brands        │ 79 Active Brands            │ 79 Active Brands (13–14 per executive)   │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Brand Target Ratios       │ Unspecified                 │ 10 Collabs/brand/month:     │ 10 Collabs/brand/month:                  │
│                           │                             │ • New: 8 Barter : 2 Paid    │ • New: 8 Barter : 2 Paid                 │
│                           │                             │ • Running: 7 Barter : 3 Paid│ • Running: 7 Barter : 3 Paid             │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Target Metric Basis       │ Gross Brand Billing         │ Gross Collab Deal Revenue   │ Ad2ship Net Margin (Profit after payout) │
│                           │                             │                             │ = Brand Received − Creator Payout        │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Monthly Target Amount     │ General agency target       │ ₹1,20,000 / executive       │ ₹1,20,000 Net Margin / executive         │
│                           │                             │ Team: ₹8,40,000 (7 staff)   │ Team Total: ₹7,20,000 (6 staff)          │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Monthly Incentive Slabs   │ None                        │ Flat 10% on clear profit if │ Two Tiered Slabs:                        │
│                           │                             │ ₹1.2L target is hit         │ • Tier 1 (₹1,00,000+ / ₹1.2L): 10% Margin│
│                           │                             │                             │ • Tier 2 (₹80,000 to ₹99,999): 5% Margin │
│                           │                             │                             │ • Below ₹80,000: 0%                      │
├───────────────────────────┼─────────────────────────────┼─────────────────────────────┼──────────────────────────────────────────┤
│ Order-Linked Bonus Layer  │ None                        │ 10% on clear profit for     │ 10% Bonus on that specific video's       │
│                           │                             │ single video with 100+ orders│ Ad2ship Margin for 100+ orders (Stacks!)│
└───────────────────────────┴─────────────────────────────┴─────────────────────────────┴──────────────────────────────────────────┘
```

---

## 3. What We Have to Change (Functional Impact Analysis)

### 🔻 A. Modules Being Deprecated / Archived:
1. **Daily Posting Checklist & Matrix View (`postingRoutes.ts`, `PostingMatrixView.tsx`):**
   - *Reason:* Routine organic posting is discontinued.
   - *Action:* Deprioritize/archive from sidebar to keep the navigation focused on the Influencer Hub.
2. **15-Day Graphic Content Calendar Cycles (`contentCalendarRoutes.ts`, `ContentCalendarView.tsx`):**
   - *Reason:* Dedicated social media design cycles are no longer primary deliverables.
   - *Action:* Retain as secondary historical archive.

---

### 🔄 B. Modules Being Modified & Restructured:
1. **Brand Management & Brand Categorization (`brands` collection):**
   - *Change:* Add `brandType: 'New' | 'Running'` to every brand.
   - *Impact:* Dictates target ratio (**8 Barter : 2 Paid** for New brands vs. **7 Barter : 3 Paid** for Running brands).
2. **Staff Hierarchy & Brand Allocation Matrix (`employee_brands` collection):**
   - *Change:* Remove Manasvi and reallocate her 11 brands across the remaining 6 active team members.
3. **Influencer Collab Deal Ledger (`influencers` collection):**
   - *Change:* Track `ordersGenerated: number` on each collaboration.
   - *Impact:* Unlocks the 100+ orders performance bonus detector.
4. **Target Banner & Analytics Engine (`targets` collection, `TargetBanner.tsx`):**
   - *Change:* Calculate Ad2ship Margin (`Brand Received − Creator Payout`) in real time.
   - *Impact:* Track progress towards individual **₹1,20,000** targets and team **₹7,20,000** target.
5. **Performance & Incentive Ledger (`PerformanceView.tsx`):**
   - *Change:* Implement the **5% (80k+)** and **10% (1L+)** tiered incentive calculator + order bonus stacking.

---

## 👥 4. 6-Member Team Brand Allocation Matrix (79 Brands)

Manasvi's 11 brands from Appendix A have been redistributed evenly across the **6 active members**:

```
                                  79 BRANDS RE-ALLOCATION MATRIX
┌─────────────────────────────┬──────────────┬────────────────────────────────────────────────────────┐
│ Team Member                 │ Total Brands │ Assigned Brand Portfolio                               │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 1. Ridhima Jain             │  13 Brands   │ 1. Vaasva, 2. Indibelle, 3. Dhibha,                    │
│                             │              │ 4. Shivaye Ev Accessories, 5. Loomista, 6. CHHAAPE,   │
│                             │              │ 7. EBBANI, 8. Jiraazi, 9. Art Of Colours,              │
│                             │              │ 10. Ramas Kurti, 11. Jaipur fame, 12. Chaitraavi,      │
│                             │              │ 13. Irabyshivi (Reallocated from Manasvi)              │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 2. Kajal Soni               │  13 Brands   │ 1. AmauraJewels, 2. Sathisa, 3. Regalliyaa,            │
│                             │              │ 4. Nypa Kurti, 5. Tavas, 6. Gabalush, 7. Kalkivastra, │
│                             │              │ 8. JIhana Fab, 9. Chavi's Jewels, 10. Aafami,          │
│                             │              │ 11. Saavarisakhi, 12. Bunaiwalaa,                      │
│                             │              │ 13. kyranmode (Reallocated from Manasvi)               │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 3. Khushi Sharma            │  13 Brands   │ 1. Shiidal, 2. Kaushalya, 3. Pinkvybe, 4. Vellisha,    │
│                             │              │ 5. Musclefix, 6. Rudravatika, 7. Panvi, 8. Barkha,     │
│                             │              │ 9. Tekme, 10. Taj textiles, 11. sheneedjewellery,      │
│                             │              │ 12. Rangpur (Reallocated from Manasvi),                │
│                             │              │ 13. House of Resmi (Reallocated from Manasvi)          │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 4. Gunjan                   │  13 Brands   │ 1. Kenix World, 2. Largish, 3. Reriko, 4. KD Design,   │
│                             │              │ 5. Moraniboutique, 6. Bave India, 7. GGhritam,         │
│                             │              │ 8. Vadya Roots, 9. Aark Jaipur, 10. Utsavya,           │
│                             │              │ 11. Saifi Gadgets,                                     │
│                             │              │ 12. Fake Loser (Reallocated from Manasvi),             │
│                             │              │ 13. Varushi (Reallocated from Manasvi)                 │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 5. Bhawna                   │  13 Brands   │ 1. e4ethnic, 2. Desibutik, 3. Sttitch,                 │
│                             │              │ 4. Western Looms, 5. Zaliba, 6. Trandset,              │
│                             │              │ 7. Vc Gifts, 8. 24 care, 9. Radhvay, 10. Lavyara,      │
│                             │              │ 11. Jaipur gift,                                       │
│                             │              │ 12. Suchira (Reallocated from Manasvi),                │
│                             │              │ 13. Thevelito facecare (Reallocated from Manasvi)      │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 6. Nikita                   │  14 Brands   │ 1. Lovewear, 2. Royal Design, 3. Rekha Bags,           │
│                             │              │ 4. Vastropedia-Mahesh JI, 5. SavariyaGhee,             │
│                             │              │ 6. Kalakruti, 7. Vexotrend, 8. Walkin Wardrobe,        │
│                             │              │ 9. Fabzone Fabindia, 10. Innwyn, 11. mshivani Export,  │
│                             │              │ 12. kashida (Reallocated from Manasvi),                │
│                             │              │ 13. Maadhvii (Reallocated from Manasvi),               │
│                             │              │ 14. Ayurhealthix (Reallocated from Manasvi)            │
├─────────────────────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ 🏆 TOTAL                    │  79 Brands   │ 100% Active Brand Coverage Across 6 Staff              │
└─────────────────────────────┴──────────────┴────────────────────────────────────────────────────────┘
```

---

## 💰 5. Mathematical Formulation of Margins & Tiered Incentives

### A. Ad2ship Margin (Net Profit):
$$\text{Ad2ship Margin} = \text{Brand Received (IN)} - \text{Influencer Paid (OUT)}$$

*Example:*
- Brand A pays **₹12,000** for an influencer campaign.
- Creator is paid **₹4,000**.
- **Ad2ship Margin = ₹8,000 (Net Profit)**. All monthly performance targets and bonus percentages calculate strictly from this net margin.

---

### B. Tiered Monthly Incentive Slabs:

```
┌──────────────────────────────────────┬──────────────────┬──────────────────────────────────────────┐
│ Achieved Monthly Ad2ship Margin      │ Incentive % Rate │ Payout Calculation                       │
├──────────────────────────────────────┼──────────────────┼──────────────────────────────────────────┤
│ ₹1,00,000 and above (Target: ₹1.2L)  │      10.0%       │ 10% × Total Monthly Ad2ship Margin       │
│                                      │                  │ (e.g. ₹1,20,000 Margin = ₹12,000 Bonus)  │
├──────────────────────────────────────┼──────────────────┼──────────────────────────────────────────┤
│ ₹80,000 to ₹99,999                   │       5.0%       │ 5% × Total Monthly Ad2ship Margin        │
│                                      │                  │ (e.g. ₹90,000 Margin = ₹4,500 Bonus)     │
├──────────────────────────────────────┼──────────────────┼──────────────────────────────────────────┤
│ Below ₹80,000                        │       0.0%       │ ₹0 (Minimum threshold not achieved)      │
└──────────────────────────────────────┴──────────────────┴──────────────────────────────────────────┘
```

- **Executive Monthly Target:** **₹1,20,000 Net Margin**
- **Team Total Monthly Target (6 Members):** **₹7,20,000 Net Margin**

---

### C. Performance Bonus (100+ Orders per Video):
- **Condition:** Any single paid influencer video generating **$\ge$ 100 orders** in that month.
- **Bonus Calculation:** **$10\% \times \text{Ad2ship Margin of that specific video}$**.
- **Stacking Rule:** This bonus is evaluated per video and **stacks on top of the monthly target incentive**, even if the executive misses their overall ₹1.2L target.

---

## 📂 6. File-by-File Technical Modifications

```
c:\Ad2ship\Influencer Mangement Software\
├── backend/
│   ├── src/models/allModels.ts          -> Add brandType ('New'|'Running') & ordersGenerated
│   ├── src/seed/seedData.ts             -> Seed 6 staff + 79 brand allocations
│   ├── src/routes/influencerRoutes.ts   -> Track orders & compute 100+ order bonus trigger
│   ├── src/routes/performanceRoutes.ts  -> Compute 5% (80k+) and 10% (1L+) tiered payouts
│   └── src/routes/targetRoutes.ts       -> Set ₹7,20,000 team target & ₹1,20,000 user target
│
└── frontend/
    ├── src/components/TargetBanner.tsx  -> Display Margin achieved + Tier progress (80k / 1.2L)
    ├── src/views/InfluencersView.tsx    -> Add "Orders Generated" input & 100+ Orders Badge
    ├── src/views/PerformanceView.tsx    -> Display Tiered Payout breakdown (5% / 10% + Order Bonus)
    ├── src/views/BrandsView.tsx         -> Display 'New' vs 'Running' badge & assigned executive
    └── src/components/Sidebar.tsx       -> Highlight Influencer Hub, Target & Performance
```

---

## ⏱️ 7. Detailed 20–22 Hours Phased Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┬────────────────┐
│ Phase & Detailed Milestone Breakdown                                        │ Estimated Time │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 1: Database Architecture, Schema Migration & Automated Seeding     │ 3.5 – 4.0 Hrs  │
│   • Update Brand schema with brandType ('New' vs 'Running')                 │                │
│   • Update Influencer schema with ordersGenerated & ad2shipMargin fields     │                │
│   • Provision the 6 active executive user accounts & profiles               │                │
│   • Build automated seeding script for all 79 active brands                 │                │
│   • Seed the 79 employee-brand assignment matrix in MongoDB                 │                │
│   • Perform data integrity checks & schema validation                       │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 2: Backend Margin Engine & Tiered Incentive Slabs (5% / 10%)       │ 4.5 – 5.0 Hrs  │
│   • Implement dynamic Net Ad2ship Margin calculation (Brand IN − Payout OUT)│                │
│   • Build Tier 1 logic: 10% Incentive on Margin for ₹1,00,000+ / ₹1,20,000  │                │
│   • Build Tier 2 logic: 5% Incentive on Margin for ₹80,000 to ₹99,999       │                │
│   • Enforce minimum threshold rule (Below ₹80,000 = ₹0 Incentive)           │                │
│   • Build monthly auto-sync engine for ₹7,20,000 team target & ₹1.2L member │                │
│   • Implement monthly date range aggregations & multi-brand profit grouping │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 3: Order-Linked Performance Bonus Engine (100+ Orders)             │ 3.0 – 3.5 Hrs  │
│   • Add order tracking endpoint & payload validation                        │                │
│   • Build 100+ orders qualifier algorithm (orders >= 100 -> 10% bonus)      │                │
│   • Implement independent bonus stacking logic (evaluated per video)        │                │
│   • Create payout calculation engine for multi-qualifying collaborations    │                │
│   • Add immutable audit logging for bonus qualification triggers            │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 4: Frontend UI, Target Banner & Incentive Ledger Hub               │ 4.5 – 5.0 Hrs  │
│   • Top Sticky Target Banner: Real-time Margin gauge & 80k/1.2L slab bars   │                │
│   • Influencers Collab Ledger: Orders input field & 100+ Orders Bonus pill  │                │
│   • Performance & Incentive View: Full breakdown card showing:              │                │
│       - Total Net Margin Generated                                          │                │
│       - Target Slab Achieved (5% vs 10%)                                    │                │
│       - Order-Linked Bonus Payout list                                      │                │
│       - Total Take-Home Incentive Amount                                    │                │
│   • Brands View: New (8:2) vs Running (7:3) status tags & executive filter  │                │
│   • Streamline Sidebar navigation to prioritize the Influencer Hub          │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 5: Quality Assurance, Boundary Testing & Edge Cases                │ 3.0 – 3.5 Hrs  │
│   • Test boundary conditions:                                               │                │
│       - ₹79,999 (0% payout) vs ₹80,000 (5% payout = ₹4,000)                 │                │
│       - ₹99,999 (5% payout) vs ₹1,00,000 (10% payout = ₹10,000)              │                │
│       - Single video with 99 orders (no bonus) vs 100 orders (10% bonus)     │                │
│       - Stacking test: Target missed + 2 videos crossing 100+ orders        │                │
│   • Cross-browser testing (Chrome, Edge, Safari, Firefox, Mobile)           │                │
│   • Performance optimization for 79-brand queries & caching                 │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🔹 Phase 6: Production Deployment, Cloud Sync & Handover                    │ 1.5 – 2.0 Hrs  │
│   • Production bundle compilation & TypeScript build validation             │                │
│   • Deploy Backend API to Render & Frontend to Vercel                       │                │
│   • Verify live MongoDB Atlas cloud data sync                               │                │
│   • Final documentation & release handover                                  │                │
├─────────────────────────────────────────────────────────────────────────────┼────────────────┤
│ 🏆 TOTAL ESTIMATED PROJECT TIMELINE                                         │ 20 – 22 Hours  │
│                                                                             │ (~3 Days)      │
└─────────────────────────────────────────────────────────────────────────────┴────────────────┘
```
