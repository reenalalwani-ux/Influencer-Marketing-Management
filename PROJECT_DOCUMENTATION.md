# Project Technical Documentation & Architecture Report
## Influencer Marketing Operations & Employee Tracking System (MVP 1.0)

**Version:** 1.0  
**Project Type:** Internal Employee Work Management System  
**Architecture:** Modular MERN Architecture  
**Frontend Stack:** React.js / Next.js, TypeScript, Tailwind CSS, Lucide Icons, Recharts  
**Backend Stack:** Node.js, Express.js, TypeScript, Mongoose ORM  
**Database Stack:** MongoDB (with MongoMemoryServer embedded fallback)  

---

## 1. Modular System Architecture Overview

The system follows a strict modular architecture to ensure that future business modules (e.g., Attendance, Payroll, Leave Management, Social Media API Automation, Invoicing) can be integrated seamlessly without major changes to the existing core database relationships or API controllers.

### Core Business Flow
```
Employee
   ↓
Brand Assignment (employee_brands collection)
   ↓
Campaign (campaigns collection)
   ↓
Daily Tasks (tasks collection)
   ↓
Posting Schedule (postings queries)
   ↓
Published URL (social media link submission)
   ↓
Verification (Manager verification workflow)
   ↓
Completion (Verified status)
   ↓
Employee Performance (Calculated completion & on-time rates)
```

---

## 2. 18 Core MVP Modules Implementation Details

### Module 1: Authentication & Session Management
- **Implementation**: JWT token generation (`24h` expiration) and password encryption via `bcryptjs`.
- **Endpoints**: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/change-password`.
- **Session Handling**: Bearer token authentication middleware attached to incoming requests.

### Module 2: Role & Permission Management
- **Key Architecture Decision**: User -> Role -> Permissions stored in separate collections.
- **Collections**: `roles` (name, permissions array), `permissions` (code, module, name), `users`.
- **System Roles**: `Super Admin`, `Admin`, `Marketing Manager`, `Team Leader`, `Employee`.

### Module 3: Employee Management
- **Independent Entity**: Employee details stored separately from task documents to support future expansion (Payroll, Goals, Attendance).
- **Attributes**: Employee ID (`EMP-1001`), Name, Email, Phone, Department, Designation, System Role, Reporting Manager ID, Joining Date, Status (`Active`/`Inactive`).

### Module 4: Brand Management
- **Purpose**: Maintain company brand portfolio.
- **Attributes**: Brand ID (`BRD-101`), Brand Name, Logo, Website, Industry, Contact Person, Email, Phone, Status (`Active`/`Inactive`), Notes.

### Module 5: Employee-Brand Assignment (`employee_brands`)
- **Important Design Rule**: Decoupled N-to-N relationship collection (`employee_brands`) rather than embedding simple brand IDs in employee documents.
- **Data**: `employeeId`, `brandId`, `assignedBy`, `startDate`, `endDate`, `responsibility`, `priority` (`Low`, `Medium`, `High`, `Urgent`), `status` (`Active`, `Completed`, `Removed`).

### Module 6: Campaign Management
- **Structure**: Brand (1) -> Campaigns (N).
- **Statuses**: `Draft`, `Planning`, `Active`, `Paused`, `Completed`, `Cancelled`.

### Module 7: Employee-Campaign Assignment (`campaign_employees`)
- **Purpose**: Connect employees to specific campaign projects with roles (`Content Creator`, `Video Coordinator`, etc.).

### Module 8: Task / Content Management
- **Fields**: `taskId` (`TSK-10001`), `employeeId`, `brandId`, `campaignId`, `platform` (`Instagram`, `YouTube`, `TikTok`, `X`, `LinkedIn`), `contentType` (`Reel`, `Story`, `Short`, `Video`, `Post`), `title`, `description`, `priority`, `scheduledDate`, `scheduledTime`, `deadline`, `status` (`Pending`, `In Progress`, `Submitted`, `Verified`, `Rejected`, `Delayed`, `Missed`).

### Module 9: Daily Posting Management
- **Operational Workspace**: Real-time counter metrics (`Total`, `Completed`, `Pending`, `Delayed`, `Rejected/Missed`) for selected dates.
- **Filters**: Employee, Brand, Campaign, Platform, Status.

### Module 10: Posting Calendar
- **Views**: Interactive `Daily`, `Weekly`, and `Monthly` visual calendar grids using task schedule data.

### Module 11: Published URL Management
- **Business Rule**: System **does not** store or upload heavy video/image files. Only social media URLs are validated and stored.
- **Features**: Social media URL format validation, platform auto-detection (`Instagram`, `YouTube`, `TikTok`, `X`, `LinkedIn`), and duplicate URL check.

### Module 12: Task Verification
- **Workflow**: Employee Publishes -> URL Submitted (`Submitted`) -> Pending Manager Verification -> Manager Verification (`Verified` or `Rejected` with Rejection Reason).
- **Audit Data**: `verifiedBy`, `verifiedAt`, `rejectionReason`, `comments`.

### Module 13: Employee Performance Analytics
- **Calculated Metrics**: Calculated dynamically from task data:
  $$\text{Completion Rate (\%)} = \left(\frac{\text{Completed Tasks}}{\text{Total Assigned Tasks}}\right) \times 100$$
  $$\text{On-Time Rate (\%)} = \left(\frac{\text{Tasks Published On or Before Deadline}}{\text{Completed Tasks}}\right) \times 100$$

### Module 14: Multi-Role Dashboard
- Customized dynamic view tailored for Super Admin (company KPIs), Manager (team performance & verification queue), or Employee ("My Day" schedule).

### Module 15: Notification Module
- In-app notification center tracking brand assignments, campaign assignments, task deadlines, and verification results.

### Module 16: Activity / Audit Logs
- Automatic audit log middleware capturing `userId`, `userName`, `action`, `module`, `entity`, `entityId`, `oldValue`, `newValue`, and `timestamp`.

### Module 17: Basic Reports & Data Export
- Employee Summary Report, Brand Summary Report, and Daily Posting Log Report with **1-click CSV file export**.

### Module 18: System Settings
- Configurable lookup parameters (Social Media Platforms, Content Types, Departments, System Roles & Permissions).

---

## 3. Database Collections Overview

```
users               - System login credentials & roles
roles               - System roles & permissions lookup
permissions         - Granular permission codes
employees           - Company staff details & hierarchy
brands              - Client brand portfolio
employee_brands     - N-to-N Employee-Brand relationship collection
campaigns           - Marketing campaigns under brands
campaign_employees  - N-to-N Employee-Campaign relationship collection
tasks               - Content tasks, daily posting schedules, published URLs & verifications
notifications       - User in-app notifications
audit_logs          - Immutable system activity log history
settings            - Configurable lookup parameters
```

---

## 4. How to Set Up & Run the Project

### Environment Setup

1. **Verify Prerequisites**:
   ```bash
   node -v    # Requires node 18+
   npm -v     # Requires npm 9+
   ```

2. **Install Root & Sub-package Dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start Development Servers**:
   - Start Backend API (Port 5000):
     ```bash
     cd backend
     npm run dev
     ```
   - Start Frontend App (Port 3000):
     ```bash
     cd frontend
     npm run dev
     ```

4. **Access the Application**:
   Open browser at `http://localhost:3000/`.

5. **Test Demo Login Credentials**:
   - Super Admin: `admin@influencer.com` / `Admin@123`
   - Marketing Manager: `manager@influencer.com` / `Manager@123`
   - Employee: `rahul@influencer.com` / `User@123`
