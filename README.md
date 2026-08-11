# Influencer Marketing Operations & Employee Tracking System (MVP 1.0)

A modular, scalable, enterprise-grade **MERN (MongoDB, Express.js, React/Next.js, Node.js)** internal employee work management software built for influencer marketing operations.

---

## 📋 Table of Contents
- [Executive Overview](#-executive-overview)
- [Core Architecture & Tech Stack](#-core-architecture--tech-stack)
- [Directory & Code Structure](#-directory--code-structure)
- [18 Core MVP Modules](#-18-core-mvp-modules)
- [Database Schema & Relationship Architecture](#-database-schema--relationship-architecture)
- [Setup & Installation Guide](#-setup--installation-guide)
- [Demo Credentials](#-demo-credentials)
- [API Documentation](#-api-documentation)
- [Build & Deployment](#-build--deployment)

---

## 🎯 Executive Overview

The **Influencer Marketing Operations & Employee Tracking System** streamlines daily influencer campaign workflows, brand assignments, content posting schedules, social media URL verification, and real-time employee performance measurement.

### Core Business Flow
```
Employee ──► Brand Assignment ──► Campaign ──► Daily Tasks ──► Posting Schedule ──► Published URL ──► Manager Verification ──► Completion ──► Performance Analytics
```

---

## 🛠️ Core Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 / Next.js + TypeScript | Component-based, responsive SPA with dark mode aesthetics |
| **Frontend UI** | Tailwind CSS + Lucide Icons + Recharts | Modern card glassmorphism, dynamic status badges & charts |
| **Backend** | Node.js + Express.js + TypeScript | Modular architecture (`/modules` or `/routes`) |
| **Database** | MongoDB (Mongoose ORM) | Dual support: Local/Cloud MongoDB or Auto-fallback In-Memory DB |
| **Auth & Security** | JWT + bcryptjs | Role-Based Access Control (RBAC) with separated permissions |
| **Build Tools** | Vite + `tsc` | Fast TypeScript compilation & bundle optimization |

---

## 📂 Directory & Code Structure

```
Influencer Mangement Software/
├── package.json                        # Root workspace configuration & scripts
├── README.md                           # Main documentation & quick start guide
├── PROJECT_DOCUMENTATION.md            # Comprehensive architecture & module guide
│
├── backend/                            # Node.js + Express + TypeScript Backend
│   ├── package.json                    # Backend dependencies
│   ├── tsconfig.json                   # TypeScript compiler configuration
│   └── src/
│       ├── server.ts                   # Express server entry point & route initialization
│       ├── config/
│       │   ├── db.ts                   # MongoDB connection with MongoMemoryServer fallback
│       │   └── constants.ts            # System lookup defaults (Roles, Permissions, Platforms)
│       ├── middleware/
│       │   ├── auth.ts                 # JWT authentication middleware
│       │   ├── rbac.ts                 # Role-based & permission checking guards
│       │   └── auditLog.ts             # Automatic activity & audit logging helper
│       ├── models/
│       │   └── allModels.ts            # Mongoose schemas for all 18 MVP collections
│       ├── routes/                     # Modular API Controllers & Routes (v1)
│       │   ├── authRoutes.ts           # Authentication & Password management
│       │   ├── rolesRoutes.ts          # Roles & Permissions CRUD
│       │   ├── employeeRoutes.ts       # Employee Management
│       │   ├── brandRoutes.ts          # Brand Management
│       │   ├── employeeBrandRoutes.ts  # Employee-Brand Assignment (N-to-N)
│       │   ├── campaignRoutes.ts       # Campaign Management
│       │   ├── campaignEmployeeRoutes.ts # Campaign-Employee Assignment
│       │   ├── taskRoutes.ts           # Task & Content Management + Published URL submission
│       │   ├── postingRoutes.ts        # Daily Posting & Posting Calendar endpoints
│       │   ├── verificationRoutes.ts   # Task Verification Queue & Decision workflow
│       │   ├── performanceRoutes.ts    # Calculated Employee Performance metrics
│       │   ├── dashboardRoutes.ts      # Multi-Role Dashboard stats generator
│       │   ├── notificationRoutes.ts   # In-app Notification management
│       │   ├── auditLogRoutes.ts       # Audit Log listing & filter endpoints
│       │   ├── reportRoutes.ts         # Basic Reports & CSV summary generators
│       │   └── settingsRoutes.ts       # Configurable System Settings & Parameters
│       └── seed/
│           └── seedData.ts             # Comprehensive database initializer & seed generator
│
└── frontend/                           # React + TypeScript + Vite + Tailwind CSS Frontend
    ├── package.json                    # Frontend dependencies
    ├── vite.config.ts                  # Vite config & API proxy configuration
    ├── tsconfig.json                   # Frontend TypeScript configuration
    ├── index.html                      # HTML entry page
    └── src/
        ├── main.tsx                    # React DOM render entry point
        ├── App.tsx                     # Application shell, layout & routing state
        ├── index.css                   # Tailwind CSS, glassmorphism design system & badges
        ├── types/
        │   └── index.ts                # TypeScript interfaces for all data entities
        ├── services/
        │   └── api.ts                  # HTTP API client wrapper
        ├── components/
        │   ├── Navbar.tsx              # Header with profile drawer & notification bell
        │   ├── Sidebar.tsx             # Left navigation menu for 18 core modules
        │   └── URLSubmissionModal.tsx  # Modal for submitting social media URLs
        └── views/                      # Core Module Views & Interfaces
            ├── LoginView.tsx           # Login screen with quick demo shortcuts
            ├── DashboardView.tsx       # Dynamic Super Admin / Manager / Employee dashboard
            ├── EmployeeManagementView.tsx # Employee directory & creation modal
            ├── BrandManagementView.tsx    # Brand portfolio cards & details modal
            ├── EmployeeBrandAssignmentView.tsx # Brand assignment matrix & history
            ├── CampaignManagementView.tsx # Campaign tracker board
            ├── TaskManagementView.tsx  # Task creation & content tracking
            ├── DailyPostingView.tsx    # Operational Daily Posting workspace
            ├── PostingCalendarView.tsx # Visual Daily/Weekly/Monthly calendar grid
            ├── VerificationQueueView.tsx # Manager Verification queue modal
            ├── EmployeePerformanceView.tsx # Employee performance leaderboard & completion rates
            ├── AuditLogView.tsx        # System Activity & Audit Trail log viewer
            ├── ReportsView.tsx         # Essential reports & 1-click CSV data export
            └── SettingsView.tsx        # System lookup parameters & RBAC configuration
```

---

## ⚡ Setup & Installation Guide

### Prerequisites
- **Node.js**: v18.x, v20.x, or v24.x installed
- **npm**: v9.x, v10.x, or v11.x installed
- **MongoDB** *(Optional)*: If an external MongoDB connection is not detected, the app automatically starts an embedded **in-memory MongoDB server** with zero manual setup!

### Step 1: Clone or Navigate to Project Directory
```bash
cd "c:\Ad2ship\Influencer Mangement Software"
```

### Step 2: Install Dependencies
You can install dependencies across the root, backend, and frontend at once:

```bash
# Option A: Install using root command
npm run install:all

# Option B: Manual step-by-step install
cd backend && npm install
cd ../frontend && npm install
```

### Step 3: Run Development Servers
Open two terminal windows (or run from root):

#### Terminal 1: Backend Server (Port 5000)
```bash
cd backend
npm run dev
```
*The backend server will start on `http://localhost:5000` and automatically populate the database with initial seed data.*

#### Terminal 2: Frontend Client (Port 3000)
```bash
cd frontend
npm run dev
```
*The frontend application will start on `http://localhost:3000`.*

---

## 🔑 Demo Credentials

The system includes pre-seeded demo accounts with password shortcuts directly on the login screen:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@influencer.com` | `Admin@123` | Full access across all 18 modules & system settings |
| **Marketing Manager** | `manager@influencer.com` | `Manager@123` | Team management, campaign creation, URL verification |
| **Employee (Rahul)** | `rahul@influencer.com` | `User@123` | Personal daily postings schedule, URL submission, my performance |
| **Employee (Priya)** | `priya@influencer.com` | `User@123` | Content creation, assigned brands, posting calendar |

---

## 🔌 API Endpoints Reference (v1)

### Authentication
- `POST /api/v1/auth/login` - Authenticate user & receive JWT token
- `GET /api/v1/auth/me` - Get current logged-in user profile & permissions
- `POST /api/v1/auth/change-password` - Update account password

### Employee Management
- `GET /api/v1/employees` - List all internal employees
- `POST /api/v1/employees` - Create new employee & login account
- `PUT /api/v1/employees/:id` - Update employee details/status

### Brand & Assignment Management
- `GET /api/v1/brands` - List all active brands
- `POST /api/v1/brands` - Add new brand portfolio
- `GET /api/v1/employee-brands` - List N-to-N employee-brand assignments
- `POST /api/v1/employee-brands/assign` - Assign employee to brand (`employee_brands`)
- `PATCH /api/v1/employee-brands/:id/unassign` - Deactivate assignment

### Campaigns
- `GET /api/v1/campaigns` - List marketing campaigns
- `POST /api/v1/campaigns` - Create brand campaign

### Tasks & Daily Postings
- `GET /api/v1/tasks` - List content tasks with filters
- `POST /api/v1/tasks` - Create trackable content task
- `POST /api/v1/tasks/:id/submit-url` - Submit published social media URL
- `GET /api/v1/postings/daily` - Operational daily posting schedule & counter metrics
- `GET /api/v1/postings/calendar` - Visual calendar data (Daily/Weekly/Monthly)

### Verification Queue
- `GET /api/v1/verification/pending` - List submissions awaiting verification
- `POST /api/v1/verification/:taskId/verify` - Manager decision (`Verified` / `Rejected` + reason)

### Analytics & Reports
- `GET /api/v1/performance` - Calculated employee performance metrics
- `GET /api/v1/dashboard/stats` - Role-tailored dashboard data
- `GET /api/v1/reports/employee-summary` - Employee performance report
- `GET /api/v1/reports/brand-summary` - Brand summary report
- `GET /api/v1/reports/daily-posting` - Daily posting log report

---

## 🏗️ Production Build

To test production builds:

```bash
# Build Backend
cd backend && npm run build

# Build Frontend
cd ../frontend && npm run build
```

Production assets will be output to `backend/dist` and `frontend/dist`.
