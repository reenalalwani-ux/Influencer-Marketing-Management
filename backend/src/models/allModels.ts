import mongoose, { Schema, Document } from 'mongoose';

// 1. Permission Schema
export interface IPermission extends Document {
  code: string;
  name: string;
  module: string;
  description?: string;
}

const PermissionSchema = new Schema<IPermission>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

// 2. Role Schema
export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: string[]; // Permission codes
  isSystemRole: boolean;
}

const RoleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ type: String }],
  isSystemRole: { type: Boolean, default: false }
}, { timestamps: true });

// 3. User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: string; // Role name or ID
  employeeId?: string;
  status: 'Pending Verification' | 'Pending Approval' | 'Active' | 'Inactive';
  emailVerified?: boolean;
  isApproved?: boolean;
  refreshToken?: string;
  activeToken?: string;
  tokenIssuedAt?: Date;
  otpCode?: string;
  otpExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, default: '' },
  role: { type: String, required: true, default: 'Employee' },
  employeeId: { type: String },
  status: { type: String, enum: ['Pending Verification', 'Pending Approval', 'Active', 'Inactive'], default: 'Pending Verification' },
  emailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  refreshToken: { type: String },
  activeToken: { type: String },
  tokenIssuedAt: { type: Date },
  otpCode: { type: String },
  otpExpiresAt: { type: Date }
}, { timestamps: true });

// 4. Employee Schema
export interface IEmployee extends Document {
  employeeId: string;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  department: string;
  designation: string;
  role: string;
  reportingManagerId?: mongoose.Types.ObjectId;
  joiningDate: Date;
  status: 'Pending Verification' | 'Pending Approval' | 'Active' | 'Inactive';
  emailVerified?: boolean;
  isApproved?: boolean;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  profileImage: { type: String },
  department: { type: String, default: 'Influencer Marketing' },
  designation: { type: String, default: 'Influencer Executive' },
  role: { type: String, default: 'Employee' },
  reportingManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending Verification', 'Pending Approval', 'Active', 'Inactive'], default: 'Pending Verification' },
  emailVerified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

// 5. Brand Schema
export interface IBrand extends Document {
  brandId: string;
  brandName: string;
  logo?: string;
  website?: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  brandType: 'New' | 'Running';
  targetBarterCollabs: number;
  targetPaidCollabs: number;
  targetTotalCollabs: number;
  notes?: string;
}

const BrandSchema = new Schema<IBrand>({
  brandId: { type: String, required: true, unique: true },
  brandName: { type: String, required: true },
  logo: { type: String },
  website: { type: String },
  industry: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  brandType: { type: String, enum: ['New', 'Running'], default: 'Running' },
  targetBarterCollabs: { type: Number, default: 7 },
  targetPaidCollabs: { type: Number, default: 3 },
  targetTotalCollabs: { type: Number, default: 10 },
  notes: { type: String }
}, { timestamps: true });

// 6. EmployeeBrand Relationship Schema
export interface IEmployeeBrand extends Document {
  employeeId: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  assignedBy?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  responsibility: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Active' | 'Completed' | 'Removed';
}

const EmployeeBrandSchema = new Schema<IEmployeeBrand>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  responsibility: { type: String, default: 'Brand Management' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, enum: ['Active', 'Completed', 'Removed'], default: 'Active' }
}, { timestamps: true });

EmployeeBrandSchema.index({ employeeId: 1, status: 1 });
EmployeeBrandSchema.index({ brandId: 1, status: 1 });

// 7. Task / Content Schema
export interface ITask extends Document {
  taskId: string;
  employeeId?: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  platform: string;
  contentType: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  scheduledDate: Date;
  scheduledTime: string; // e.g. "10:00 AM"
  deadline: Date;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Verified' | 'Completed' | 'Rejected' | 'Delayed' | 'Missed';
  publishedUrl?: string;
  publishedDate?: Date;
  verificationStatus: 'Unsubmitted' | 'Pending Verification' | 'Verified' | 'Rejected';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  comments?: string;
  remarks?: string;
  isMainTask?: boolean;
  parentTaskId?: mongoose.Types.ObjectId;
}

const TaskSchema = new Schema<ITask>({
  taskId: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: false },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  platform: { type: String, required: true },
  contentType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  remarks: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Submitted', 'Verified', 'Completed', 'Rejected', 'Delayed', 'Missed'],
    default: 'Pending'
  },
  publishedUrl: { type: String },
  publishedDate: { type: Date },
  verificationStatus: {
    type: String,
    enum: ['Unsubmitted', 'Pending Verification', 'Verified', 'Rejected'],
    default: 'Unsubmitted'
  },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  rejectionReason: { type: String },
  comments: { type: String },
  isMainTask: { type: Boolean, default: false },
  parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task' }
}, { timestamps: true });

TaskSchema.index({ scheduledDate: 1, status: 1 });
TaskSchema.index({ employeeId: 1, scheduledDate: 1 });
TaskSchema.index({ brandId: 1 });

// 10. Notification Schema
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'Assignment' | 'Deadline' | 'Delayed' | 'Verification' | 'System';
  relatedId?: string;
  read: boolean;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Assignment', 'Deadline', 'Delayed', 'Verification', 'System'], default: 'System' },
  relatedId: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// 11. Audit Log Schema
export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userName: string;
  action: string; // e.g. "CREATE_BRAND", "VERIFY_TASK"
  module: string;
  entity: string;
  entityId?: string;
  oldValue?: Schema.Types.Mixed;
  newValue?: Schema.Types.Mixed;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: String },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

AuditLogSchema.index({ timestamp: -1 });

// 12. System Settings Schema
export interface ISetting extends Document {
  key: string;
  value: Schema.Types.Mixed;
  category: string;
  description?: string;
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  category: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

// 13. Target Schema
export interface ITarget extends Document {
  title: string;
  targetType: 'Paid' | 'Barter';
  targetMetric: 'Margin' | 'Revenue' | 'Count';
  targetAmount: number;
  achievedAmount: number;
  targetCount: number;
  achievedCount: number;
  currency: string;
  period: string;
  startDate?: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'Archived';
  isActive: boolean;
  autoSync: boolean;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const TargetSchema = new Schema<ITarget>({
  title: { type: String, required: true },
  targetType: { type: String, enum: ['Paid', 'Barter'], default: 'Paid' },
  targetMetric: { type: String, enum: ['Margin', 'Revenue', 'Count'], default: 'Margin' },
  targetAmount: { type: Number, required: true, default: 0 },
  achievedAmount: { type: Number, required: true, default: 0 },
  targetCount: { type: Number, default: 0 },
  achievedCount: { type: Number, default: 0 },
  currency: { type: String, default: '₹' },
  period: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Archived'], default: 'Active' },
  isActive: { type: Boolean, default: true },
  autoSync: { type: Boolean, default: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

TargetSchema.index({ isActive: 1, status: 1 });

// 14. Influencer Schema
export interface IInfluencer extends Document {
  sNo?: number;
  transactionDate?: Date;
  connectedDate?: Date;
  influencerManager?: string;
  brandManagerTeam?: string;
  assignedExecutive?: string;
  brandId?: mongoose.Types.ObjectId;
  brandName: string;
  influencerName: string;
  influencerInstagramId?: string;
  phone?: string;
  profileLink?: string;
  category: 'Paid' | 'Barter';

  // Financial Breakdown
  brandOnboardingAmt: number;
  brandReceivedAmt: number;
  brandPendingAmt: number;
  influencerOnboardingAmt: number;
  influencerPaidAmt: number;
  influencerPendingAmt: number;
  ad2shipMargin: number;
  inAmount: number;
  outAmount: number;
  balance: number;
  finalPaymentReceived: boolean;

  // Deliverables & Content Details
  productLink?: string;
  videoType?: string;
  videoDescription?: string;
  refVideoLink?: string;
  orderId?: string;
  orderDate?: Date;
  platform: string;
  status: 'Pending' | 'Under Review' | 'Completed' | 'Settled' | 'Approved';
  contentLink?: string;
  adsCode?: string;
  viewsCount?: number;
  ordersCount?: number;
  ordersGenerated?: number;
  isOrderBonusQualified?: boolean;
  isApproved?: boolean;
  approvalStatus?: 'Approved' | 'Not Approved' | 'Pending';
  reason?: string;
  notes?: string;
  remark?: string;
  sheetRowIndex?: number;
  createdBy?: mongoose.Types.ObjectId;
}

const InfluencerSchema = new Schema<IInfluencer>({
  sNo: { type: Number },
  transactionDate: { type: Date },
  connectedDate: { type: Date },
  influencerManager: { type: String, default: '' },
  brandManagerTeam: { type: String, default: '' },
  assignedExecutive: { type: String, default: '' },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
  brandName: { type: String, required: true },
  influencerName: { type: String, required: true },
  influencerInstagramId: { type: String, default: '' },
  phone: { type: String, default: '' },
  profileLink: { type: String, default: '' },
  category: { type: String, enum: ['Paid', 'Barter'], default: 'Paid', required: true },

  // Financial Breakdown
  brandOnboardingAmt: { type: Number, default: 0 },
  brandReceivedAmt: { type: Number, default: 0 },
  brandPendingAmt: { type: Number, default: 0 },
  influencerOnboardingAmt: { type: Number, default: 0 },
  influencerPaidAmt: { type: Number, default: 0 },
  influencerPendingAmt: { type: Number, default: 0 },
  ad2shipMargin: { type: Number, default: 0 },
  inAmount: { type: Number, default: 0 },
  outAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  finalPaymentReceived: { type: Boolean, default: false },

  // Deliverables & Content
  productLink: { type: String, default: '' },
  videoType: { type: String, default: 'Single Product Video' },
  videoDescription: { type: String, default: '' },
  refVideoLink: { type: String, default: '' },
  orderId: { type: String, default: '' },
  orderDate: { type: Date },
  platform: { type: String, default: 'Instagram' },
  status: { type: String, enum: ['Pending', 'Under Review', 'Completed', 'Settled', 'Approved'], default: 'Pending' },
  contentLink: { type: String, default: '' },
  adsCode: { type: String, default: '' },
  viewsCount: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  ordersGenerated: { type: Number, default: 0 },
  isOrderBonusQualified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['Approved', 'Not Approved', 'Pending'], default: 'Pending' },
  reason: { type: String, default: '' },
  notes: { type: String, default: '' },
  remark: { type: String, default: '' },
  sheetRowIndex: { type: Number },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

InfluencerSchema.index({ category: 1, status: 1, transactionDate: -1 });
InfluencerSchema.index({ brandName: 1 });

export interface IPaymentLog extends Document {
  influencerId?: mongoose.Types.ObjectId;
  influencerName: string;
  brandName: string;
  type: 'IN' | 'OUT';
  amount: number;
  inAmount?: number;
  outAmount?: number;
  balance?: number;
  month?: string;
  paymentDate?: Date;
  paymentMode: string;
  referenceNo?: string;
  handledBy?: string;
  notes?: string;
  transactionDate: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentLogSchema = new Schema<IPaymentLog>({
  influencerId: { type: Schema.Types.ObjectId, ref: 'Influencer' },
  influencerName: { type: String, required: true },
  brandName: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  amount: { type: Number, required: true, default: 0 },
  inAmount: { type: Number, default: 0 },
  outAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  month: { type: String, default: '' },
  paymentDate: { type: Date },
  paymentMode: { type: String, default: 'Bank Transfer' },
  referenceNo: { type: String, default: '' },
  handledBy: { type: String, default: '' },
  notes: { type: String, default: '' },
  transactionDate: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export interface IContentCalendar extends Document {
  brandId?: mongoose.Types.ObjectId;
  brandName: string;
  postDate: Date;
  dayOfWeek?: string;
  typeOfPost: string;
  platform: string;
  referenceLink?: string;
  mediaLink?: string;
  assignedDesignerId?: mongoose.Types.ObjectId;
  assignedDesignerName?: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Published';
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const ContentCalendarSchema = new Schema<IContentCalendar>({
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
  brandName: { type: String, required: true },
  postDate: { type: Date, required: true },
  dayOfWeek: { type: String, default: '' },
  typeOfPost: { type: String, required: true, default: 'Intro Post' },
  platform: { type: String, default: 'Instagram' },
  referenceLink: { type: String, default: '' },
  mediaLink: { type: String, default: '' },
  assignedDesignerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  assignedDesignerName: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Pending', 'Approved', 'Published'], default: 'Pending' },
  notes: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Export Models
export interface IGoogleSheetConfig extends Document {
  sheetUrl: string;
  sheetId?: string;
  autoSyncEnabled: boolean;
  syncIntervalSeconds: number;
  lastSyncedAt?: Date;
  lastSyncedCount: number;
  lastSyncStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
  lastSyncMessage?: string;
  updatedBy?: mongoose.Types.ObjectId;
}

export const GoogleSheetConfigSchema = new Schema<IGoogleSheetConfig>({
  sheetUrl: { type: String, default: '' },
  sheetId: { type: String, default: '' },
  autoSyncEnabled: { type: Boolean, default: true },
  syncIntervalSeconds: { type: Number, default: 60 },
  lastSyncedAt: { type: Date },
  lastSyncedCount: { type: Number, default: 0 },
  lastSyncStatus: { type: String, enum: ['SUCCESS', 'ERROR', 'IDLE'], default: 'IDLE' },
  lastSyncMessage: { type: String, default: '' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
export const Role = mongoose.model<IRole>('Role', RoleSchema);
export const User = mongoose.model<IUser>('User', UserSchema);
export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
export const EmployeeBrand = mongoose.model<IEmployeeBrand>('EmployeeBrand', EmployeeBrandSchema);
export const Task = mongoose.model<ITask>('Task', TaskSchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
export const Target = mongoose.model<ITarget>('Target', TargetSchema);
export const Influencer = mongoose.model<IInfluencer>('Influencer', InfluencerSchema);
export const PaymentLog = mongoose.model<IPaymentLog>('PaymentLog', PaymentLogSchema);
export const ContentCalendar = mongoose.model<IContentCalendar>('ContentCalendar', ContentCalendarSchema);
export const GoogleSheetConfig = mongoose.model<IGoogleSheetConfig>('GoogleSheetConfig', GoogleSheetConfigSchema);



