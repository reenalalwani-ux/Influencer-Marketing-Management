export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId?: string;
  permissions: string[];
  employeeDetails?: Employee;
}

export interface Employee {
  _id: string;
  employeeId: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  department: string;
  designation: string;
  role: string;
  reportingManagerId?: Employee | string;
  joiningDate: string;
  status: 'Active' | 'Inactive';
}

export interface Brand {
  _id: string;
  brandId: string;
  brandName: string;
  logo?: string;
  website?: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  notes?: string;
  assignedEmployees?: EmployeeBrandAssignment[];
}

export interface EmployeeBrandAssignment {
  _id: string;
  employeeId: Employee | string;
  brandId: Brand | string;
  assignedBy?: User | string;
  startDate: string;
  endDate?: string;
  responsibility: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Active' | 'Completed' | 'Removed';
}

export interface TaskItem {
  _id: string;
  taskId: string;
  employeeId: Employee | any;
  brandId: Brand | any;
  platform: string;
  contentType: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  scheduledDate: string;
  scheduledTime: string;
  deadline: string;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Verified' | 'Rejected' | 'Delayed' | 'Missed';
  publishedUrl?: string;
  publishedDate?: string;
  verificationStatus: 'Unsubmitted' | 'Pending Verification' | 'Verified' | 'Rejected';
  verifiedBy?: User | any;
  verifiedAt?: string;
  rejectionReason?: string;
  comments?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Assignment' | 'Deadline' | 'Delayed' | 'Verification' | 'System';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userName: string;
  action: string;
  module: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface SystemRole {
  _id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
}

export interface PerformanceMetrics {
  totalAssigned: number;
  completed: number;
  pending: number;
  delayed: number;
  missed: number;
  completionRate: number;
  onTimeRate: number;
  brandsManaged: number;
}

export interface EmployeePerformanceData {
  employee: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    department: string;
    designation: string;
    role: string;
  };
  metrics: PerformanceMetrics;
}

export interface TargetItem {
  _id: string;
  title: string;
  targetAmount: number;
  achievedAmount: number;
  currency: string;
  period: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Completed' | 'Archived';
  isActive: boolean;
  description?: string;
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}
