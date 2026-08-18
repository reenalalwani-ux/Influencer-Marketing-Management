# Project Scope & Technical Specification Document (Scope of Work)

**System Name:** Influencer Marketing Operations & Enterprise Employee Tracking System  
**Organization:** Ad2ship Operations  
**Version:** 2.0 (Enterprise Production Release)  
**Document Type:** Full Scope of Work (SOW) & Technical Specification  
**Architecture:** Full-Stack Modular MERN (MongoDB, Express, React, Node.js) with TypeScript  

---

## 1. Executive Summary & Business Objectives

The **Influencer Marketing Operations & Employee Tracking System** is an enterprise-grade web application built to streamline, monitor, and automate end-to-end influencer marketing campaigns, brand portfolio allocations, daily content posting workflows, creator financial ledgers, and staff performance tracking for **Ad2ship**.

### Core Business Objectives:
1. **Centralize Influencer Operations:** Eliminate disconnected spreadsheets by consolidating Paid and Barter influencer deals, financial margins, creator payouts, and brand receipts into a real-time ledger.
2. **Enforce Operational Accountability:** Track daily content publishing across social media platforms (Instagram, YouTube, TikTok, LinkedIn, X, Facebook) with automatic platform detection, duplicate URL prevention, and manager verification workflows.
3. **Automate Content Scheduling:** Plan and generate 15-day / monthly brand content calendars with assigned graphic designers and shareable public client preview links.
4. **Track Financial Targets & Margins:** Monitor monthly Paid Revenue/Margin targets and Barter Collab counts in real-time with an active header banner and automatic synchronization from transaction records.
5. **Enterprise Security & Role Isolation:** Secure access via corporate domain validation (`@ad2ship.com`), Google Apps Script Gmail OTP authentication, HttpOnly cookies, and database-validated JWT sessions.

---

## 2. Technology Stack & Architectural Specifications

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER (FRONTEND)                        │
│   React 18  •  TypeScript  •  Vite  •  TailwindCSS  •  Lucide Icons    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + HttpOnly Cookies
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION TIER (BACKEND)                      │
│      Node.js  •  Express.js  •  TypeScript  •  cookie-parser           │
│      JWT Auth Middleware  •  RBAC Engine  •  Audit Log Interceptor     │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Mongoose ORM                   │ Webhook (Port 443)
                    ▼                                ▼
┌──────────────────────────────────────┐   ┌─────────────────────────────┐
│             DATABASE TIER            │   │      THIRD-PARTY INTEGRATION│
│     MongoDB Atlas (Cloud Cluster)    │   │  Google Apps Script (Gmail) │
└──────────────────────────────────────┘   └─────────────────────────────┘
```

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (TypeScript) | Reactive, single-page application with modular view components |
| **Frontend Tooling** | Vite 5 | Ultra-fast build bundling and Hot Module Replacement (HMR) |
| **Styling & UI Design** | Tailwind CSS & Vanilla CSS | Modern responsive design, glassmorphism, gradient badges, and data tables |
| **Backend Runtime** | Node.js (v18+) & Express 4 | High-performance RESTful API micro-services |
| **Language** | TypeScript | End-to-end type safety across models, middleware, and frontend props |
| **Database** | MongoDB Atlas / Mongoose ORM | Cloud-hosted document database with strict Mongoose schema validation |
| **Authentication** | JWT + HttpOnly Cookies | Stateless cryptographic token storage with server-side DB session sync |
| **Email Dispatch** | Google Apps Script Webhook | HTTPS Port 443 Gmail API dispatch for 6-digit OTP delivery |

---

## 3. User Roles & Permission Matrix (RBAC)

The system enforces a granular **Role-Based Access Control (RBAC)** architecture where permissions are assigned to roles, and roles are assigned to users.

```
Super Admin / Admin
  ├── Unrestricted global access to all modules, financial data, and database overview
  └── Exclusive access to Employee Management, Role Editor, System Settings, and Audit Logs
Marketing Manager
  ├── Brand assignments, Influencer Collab approvals, and Target setting
  └── Content verification queue approval/rejection and team performance analytics
Team Leader
  ├── Campaign & Task creation, calendar cycle generation, and daily posting tracking
Employee / Influencer Executive
  ├── View only assigned brands and tasks
  ├── Daily posting checklist and Published URL submissions
  └── Personal performance metrics and assigned brand content calendar
Public Viewer (External Client)
  └── Read-only access to brand content calendar via secure URL share token (no login required)
```

---

## 4. Detailed Scope of Functional Modules

```
                                    SYSTEM MODULE MAP
┌──────────────────────┬──────────────────────┬──────────────────────┬──────────────────────┐
│  1. Auth & Security  │  2. Brand Management │ 3. Employee Mgmt     │ 4. Influencer Ledger │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│  5. Target Banner    │  6. Task Operations  │ 7. Daily Posting     │ 8. Content Calendar  │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│  9. Public Sharing   │ 10. URL Verification │ 11. Performance KPI  │ 12. Multi Dashboard  │
├──────────────────────┼──────────────────────┼──────────────────────┼──────────────────────┤
│ 13. Audit Trails     │ 14. Export Reports   │ 15. System Settings  │ 16. Database Viewer  │
└──────────────────────┴──────────────────────┴──────────────────────┴──────────────────────┘
```

### Module 1: Authentication, OTP Security & Session Management
- **Company Domain Restriction:** Only `@ad2ship.com` email addresses are permitted to log in or register.
- **Two-Factor OTP Login:** Generates a 6-digit random verification code with a 10-minute expiry time, dispatched via Google Apps Script HTTPS webhook to the user's Gmail.
- **HttpOnly Cookie Token Storage:** JWT tokens are issued with a 24-hour lifespan and stored exclusively in browser `HttpOnly` cookies (`SameSite=Lax`), preventing XSS token theft.
- **Database Session Synchronization:** Every active token is stored in the MongoDB `User.activeToken` field and checked on every API request. Logging out immediately revokes the session in the database.

### Module 2: Employee Hierarchy & Staff Directory
- **Employee Profiles:** Auto-generates IDs (`EMP-1001`), captures Department, Designation, Work Email, Contact Phone, Reporting Manager, and Joining Date.
- **Account Synchronization:** Creating or updating an employee automatically provisions and synchronizes the associated `User` login account.
- **Account Deactivation:** Inactivating an employee immediately revokes system login capabilities.

### Module 3: Brand Portfolio Management
- **Brand Registry:** Manages client brands with Brand ID (`BRD-101`), Logo, Official Website, Industry, Point of Contact (POC), Email, Phone, and Operational Notes.
- **Live Assignment Association:** Real-time visibility into which executives and managers are currently assigned to each brand.

### Module 4: Employee-Brand Assignment (Decoupled Matrix)
- **N-to-N Relationship Collection:** Decouples staff and brand documents via the `employee_brands` collection to allow flexible reassignments without data loss.
- **Assignment Attributes:** Tracks `startDate`, `endDate`, `responsibility`, `priority` (`Low`, `Medium`, `High`, `Urgent`), and `status` (`Active`, `Completed`, `Removed`).
- **One-Click Multi-Brand Sync:** Allows managers to assign multiple brands to an executive simultaneously from a single modal.

### Module 5: Influencer Deals & Creator Financial Ledger
- **Paid & Barter Deal Tracking:** Captures creator name, handle/profile URL, phone, category (`Paid` vs `Barter`), video type, product link, reference video, order ID, and platform.
- **Automatic Financial Calculation Engine:**
  $$\text{Brand Pending Amount} = \text{Brand Onboarding Amount} - \text{Brand Received Amount}$$
  $$\text{Influencer Pending Amount} = \text{Influencer Onboarding Amount} - \text{Influencer Paid Amount}$$
  $$\text{Ad2ship Margin} = \text{Brand Onboarding Amount} - \text{Influencer Onboarding Amount}$$
  $$\text{Net Balance} = \text{Brand Received (IN)} - \text{Influencer Paid (OUT)}$$
- **Payment Log Sub-Ledger:** Automatically creates linked `IN` (Brand payment) and `OUT` (Creator payout) payment log entries with payment mode (UPI, Bank Transfer), reference numbers, and handlers.
- **Flexible Timeframe Filtering:** Filter transactions by All Time, Today, Specific Month/Year (e.g. `august_2026`), or custom search query.

### Module 6: Target Management & Top System Revenue Banner
- **Sticky Top Target Banner:** Always-visible progress header showing Target Goal, Achieved Amount, Remaining Balance, and an animated progress bar.
- **Target Metrics:** Supports `Margin` (₹), `Revenue` (₹), and `Count` (Barter collab counts).
- **Auto-Sync Engine:** Automatically re-calculates achieved margins and barter counts directly from live influencer transactions whenever a deal is added, edited, or deleted.

### Module 7: Task & Content Operations
- **Task Hierarchy:** Supports **Master Campaign Tasks** (`MAIN-10001`) with nested **Sub-Tasks** or Standalone Tasks (`TSK-10001`).
- **Task Metadata:** Platform, Content Type (`Reel`, `Story`, `Post`, `Short`, `Video`), Scheduled Date & Time, Deadline, Description, and Priority.
- **Status Lifecycle:** `Pending` → `In Progress` → `Submitted` → `Verified` (or `Rejected` / `Delayed` / `Missed`).

### Module 8: Daily Posting Checklist & Operations Matrix
- **Daily Operations Workspace:** Filter tasks for any chosen date with real-time operational counters (`Total`, `Completed`, `Pending`, `Delayed`, `Rejected`).
- **Posting Calendar Spreadsheet Matrix:** Interactive monthly spreadsheet grid displaying all assigned brands on the Y-axis and all days of the month on the X-axis, allowing 1-click posting status toggles.

### Module 9: Content Calendar & 15-Day Cycle Automation
- **Cycle Initialization Generator:** Automatically provisions 15-day (`1st-15th`, `16th-End`) or Full-Month posting schedules for a brand with selectable posting frequency (Daily, Alternate Days, Single) and rotating content types.
- **Designer Workflow Integration:** Assign specific graphic designers to content calendar cards with direct reference link and finished media link storage.

### Module 10: Public Shareable Calendar
- **Deterministic Token Generator:** Generates a secure base64 share token based on `brandName|year|month`.
- **Public Client View:** Secure, read-only external route (`#/share/<token>`) allowing client brand managers to preview scheduled and published posts without creating a system account.

### Module 11: Published URL Submission & Verification Queue
- **Client Submission Modal:** Validates social media URLs (Instagram, YouTube, TikTok, X, LinkedIn, Facebook) and auto-detects the platform.
- **Duplicate Prevention:** Prevents submitting a URL that was already verified or submitted for another task.
- **Manager Verification Queue:** Dedicated review inbox for managers to verify live links with 1-click `Verify` or `Reject` (with mandatory rejection reason).

### Module 12: Employee Performance Analytics & KPIs
- **Dynamic KPI Formulas:**
  $$\text{Completion Rate (\%)} = \left(\frac{\text{Completed Tasks}}{\text{Total Assigned Tasks}}\right) \times 100$$
  $$\text{On-Time Rate (\%)} = \left(\frac{\text{Tasks Published On or Before Deadline}}{\text{Completed Tasks}}\right) \times 100$$
- **Role Isolation:** Employees can only see their own performance metrics, while Managers and Admins can view the entire department leaderboard.

### Module 13: Activity Trail & Immutable Audit Logs
- **Automated Audit Interceptor:** Logs every write action (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `VERIFY`, `ASSIGN`) capturing User ID, Name, Action, Module, Entity ID, and snapshot of old vs new values.

### Module 14: Reports, Business Analytics & CSV Export
- **Report Types:** Employee Performance Summary, Brand Portfolio Health, and Daily Posting Audit.
- **1-Click CSV Export:** Generates formatted, client-ready `.csv` spreadsheet downloads.

### Module 15: System Settings & Database Administration
- **Global Parameter Settings:** Configurable social platforms, content types, departments, and designations.
- **Admin Database Viewer:** Live document count and raw JSON document inspection for all 14 database collections.

---

## 5. Database Schema & Data Dictionary (14 Collections)

```
                            DATABASE RELATIONSHIP SCHEMA
┌────────────────┐          ┌────────────────┐          ┌────────────────┐
│      User      │─────────▶│    Employee    │─────────▶│ EmployeeBrand  │
│ (activeToken)  │          │   (userId)     │          │  (N:N Rel)     │
└────────────────┘          └────────────────┘          └───────┬────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌────────────────┐          ┌────────────────┐          ┌────────────────┐
│   AuditLog     │          │     Task       │◀─────────│     Brand      │
│  (Activity)    │          │  (Post URL)    │          │  (Portfolio)   │
└────────────────┘          └────────────────┘          └───────┬────────┘
                                    ▲                           │
                                    │                           ▼
┌────────────────┐          ┌───────┴────────┐          ┌────────────────┐
│ ContentCalendar│◀─────────│   Influencer   │◀─────────│   PaymentLog   │
│ (Cycle Plan)   │          │ (Deal Ledger)  │          │   (IN / OUT)   │
└────────────────┘          └────────────────┘          └────────────────┘
```

### Complete Collection Index:
1. `users` — Authentication credentials, encrypted passwords, roles, OTP state, and `activeToken` session strings.
2. `employees` — Staff records, departments, designations, joining dates, and reporting managers.
3. `roles` — System roles (`Super Admin`, `Admin`, `Marketing Manager`, `Team Leader`, `Employee`) with assigned permissions.
4. `permissions` — Granular action permission codes (e.g. `brand.create`, `influencer.view`).
5. `brands` — Client company portfolio profiles and points of contact.
6. `employee_brands` — N-to-N assignment records mapping staff to client brands.
7. `influencers` — Influencer collaboration deals with full financial breakdowns, deliverables, and margins.
8. `payment_logs` — Monetary transaction logs tracking brand payments (IN) and creator payouts (OUT).
9. `targets` — Monthly revenue, margin, and barter count targets with auto-sync configuration.
10. `tasks` — Daily content deliverables, schedules, published URLs, and verification states.
11. `content_calendars` — 15-day / monthly brand post scheduling and design assignments.
12. `notifications` — In-app alerts for assignments, deadlines, and verification results.
13. `audit_logs` — Activity trails capturing system modifications.
14. `settings` — Global system key-value configurations and platform dropdowns.

---

## 6. REST API Architecture & Standard Response Specification

All backend endpoints are prefixed with `/api/v1/` and follow standardized HTTP status codes and response bodies:

### Standard Success Response (`200 OK`):
```json
{
  "success": true,
  "count": 12,
  "data": [ ... ],
  "message": "Records fetched successfully"
}
```

### Standard Empty Collection Response (`200 OK`):
```json
{
  "success": true,
  "count": 0,
  "data": [],
  "message": "No records found"
}
```

### Standard Not Found Response (`404 Not Found`):
```json
{
  "success": false,
  "message": "No record exists for this identifier"
}
```

### Standard Authorization / Session Expired Response (`401 / 403`):
```json
{
  "success": false,
  "message": "Session expired or invalidated. Please log in again."
}
```

---

## 7. Security, Validation & Compliance Standards

1. **XSS Protection:** Access tokens are stored in `HttpOnly`, `SameSite=Lax` cookies that are inaccessible to JavaScript.
2. **Password Security:** Salted and hashed using `bcryptjs` with a cost factor of 10.
3. **Database-Validated Sessions:** Tokens are validated against the database on every request, allowing instantaneous server-side revocation.
4. **Corporate Domain Lockdown:** Backend and frontend reject non-`@ad2ship.com` email addresses during both login and registration.
5. **No File Bloat Rule:** The system intentionally stores validated social media URLs rather than hosting heavy video/image assets, keeping server resource usage lightweight and fast.

---

## 8. Development & Production Deployment Guide

### Local Environment Setup:
```bash
# 1. Clone repository
git clone https://github.com/reenalalwani-ux/Influencer-Marketing-Management.git
cd "Influencer Marketing Management"

# 2. Install all dependencies across root, backend, and frontend
npm run install:all

# 3. Start development servers concurrently (Backend: 5000 | Frontend: 5173)
npm run dev
```

### Production Build:
```bash
# Build production bundles
npm run build

# Start backend server in production
cd backend
npm run start
```

---

## 9. Future Roadmap & Extensibility (Phase 2)

Because the codebase is built on decoupled Mongoose collections, the following modules can be added in future updates without refactoring existing schemas:
1. **Automated Social API Insights:** Direct Instagram Graph API / YouTube Data API integration to pull live view counts, likes, and reach automatically.
2. **Invoice & Tax Generator:** Auto-generating GST invoices for brands and TDS payout certificates for influencers directly from `payment_logs`.
3. **Employee Attendance & Leave Portal:** Connecting daily posting performance with staff attendance records.
4. **WhatsApp Business API Notifications:** Instant OTP and task deadline alerts sent directly to executives' WhatsApp numbers.
