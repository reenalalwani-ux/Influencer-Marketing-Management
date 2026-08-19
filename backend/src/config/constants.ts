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
  'audit.view',

  // Target Module
  'target.view',
  'target.create',
  'target.update',
  'target.delete',

  // Influencer Module
  'influencer.view',
  'influencer.create',
  'influencer.update',
  'influencer.delete'
];

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  [ROLES.SUPER_ADMIN]: PERMISSIONS,
  [ROLES.ADMIN]: PERMISSIONS,
  [ROLES.MARKETING_MANAGER]: [
    'employee.view', 'employee.create', 'employee.update', 'employee.delete',
    'brand.view', 'brand.create', 'brand.update', 'brand.delete', 'brand.assign',
    'task.view', 'task.create', 'task.update', 'task.delete', 'task.verify',
    'posting.view', 'posting.create', 'posting.update',
    'performance.view', 'report.view', 'report.export',
    'settings.view', 'audit.view',
    'target.view', 'target.create', 'target.update', 'target.delete',
    'influencer.view', 'influencer.create', 'influencer.update', 'influencer.delete'
  ],
  [ROLES.TEAM_LEADER]: [
    'employee.view', 'employee.create', 'employee.update',
    'brand.view', 'brand.create', 'brand.update', 'brand.assign',
    'task.view', 'task.create', 'task.update', 'task.verify',
    'posting.view', 'posting.create', 'posting.update',
    'performance.view', 'report.view',
    'target.view', 'target.update',
    'influencer.view', 'influencer.create', 'influencer.update'
  ],
  [ROLES.EMPLOYEE]: [
    'employee.view',
    'brand.view',
    'task.view', 'task.create', 'task.update',
    'posting.view', 'posting.update',
    'performance.view',
    'target.view',
    'influencer.view', 'influencer.create', 'influencer.update', 'influencer.delete'
  ]
};

export const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'X (Twitter)', 'LinkedIn', 'Facebook'];
export const CONTENT_TYPES = ['Reel', 'Post', 'Story', 'Short', 'Video', 'Carousel', 'Article', 'Tweet'];
export const TASK_STATUSES = ['Pending', 'In Progress', 'Submitted', 'Verified', 'Rejected', 'Delayed', 'Missed'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const DEPARTMENTS = ['Influencer Marketing', 'Content Creation', 'Campaign Strategy', 'Quality Control', 'Management'];
export const DESIGNATIONS = ['Marketing Manager', 'Senior Influencer Specialist', 'Influencer Executive', 'Content Strategist', 'Team Lead'];
