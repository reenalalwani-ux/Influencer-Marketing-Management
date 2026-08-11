export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  MARKETING_MANAGER: 'Marketing Manager',
  TEAM_LEADER: 'Team Leader',
  EMPLOYEE: 'Employee',
};

export const PERMISSIONS = [
  // User & Employee
  'employee.view',
  'employee.create',
  'employee.update',
  'employee.delete',

  // Brand
  'brand.view',
  'brand.create',
  'brand.update',
  'brand.delete',
  'brand.assign',

  // Campaign
  'campaign.view',
  'campaign.create',
  'campaign.update',
  'campaign.delete',
  'campaign.assign',

  // Task
  'task.view',
  'task.create',
  'task.update',
  'task.delete',
  'task.verify',

  // Daily Postings & Calendar
  'posting.view',
  'posting.create',
  'posting.update',

  // Performance & Reports
  'performance.view',
  'report.view',
  'report.export',

  // Settings & System
  'settings.view',
  'settings.update',
  'audit.view'
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: PERMISSIONS,
  [ROLES.ADMIN]: PERMISSIONS,
  [ROLES.MARKETING_MANAGER]: [
    'employee.view',
    'brand.view', 'brand.create', 'brand.update', 'brand.assign',
    'campaign.view', 'campaign.create', 'campaign.update', 'campaign.assign',
    'task.view', 'task.create', 'task.update', 'task.verify',
    'posting.view', 'posting.create', 'posting.update',
    'performance.view', 'report.view', 'report.export',
    'settings.view'
  ],
  [ROLES.TEAM_LEADER]: [
    'employee.view',
    'brand.view',
    'campaign.view', 'campaign.update',
    'task.view', 'task.create', 'task.update', 'task.verify',
    'posting.view', 'posting.create', 'posting.update',
    'performance.view', 'report.view'
  ],
  [ROLES.EMPLOYEE]: [
    'brand.view',
    'campaign.view',
    'task.view', 'task.update',
    'posting.view', 'posting.update',
    'performance.view'
  ]
};

export const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'X (Twitter)', 'LinkedIn', 'Facebook'];
export const CONTENT_TYPES = ['Reel', 'Post', 'Story', 'Short', 'Video', 'Carousel', 'Article', 'Tweet'];
export const TASK_STATUSES = ['Pending', 'In Progress', 'Submitted', 'Verified', 'Rejected', 'Delayed', 'Missed'];
export const CAMPAIGN_STATUSES = ['Draft', 'Planning', 'Active', 'Paused', 'Completed', 'Cancelled'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const DEPARTMENTS = ['Influencer Marketing', 'Content Creation', 'Campaign Strategy', 'Quality Control', 'Management'];
export const DESIGNATIONS = ['Marketing Manager', 'Senior Influencer Specialist', 'Influencer Executive', 'Content Strategist', 'Team Lead'];
