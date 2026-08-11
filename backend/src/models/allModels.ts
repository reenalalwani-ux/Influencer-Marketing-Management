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
  password: string;
  role: string; // Role name or ID
  employeeId?: string;
  status: 'Active' | 'Inactive';
  refreshToken?: string;
  otpCode?: string;
  otpExpiresAt?: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true, default: 'Employee' },
  employeeId: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  refreshToken: { type: String },
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
  status: 'Active' | 'Inactive';
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  profileImage: { type: String },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  role: { type: String, required: true },
  reportingManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
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

// 7. Campaign Schema
export interface ICampaign extends Document {
  brandId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  platforms: string[];
  startDate: Date;
  endDate: Date;
  status: 'Draft' | 'Planning' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';
  managerId?: mongoose.Types.ObjectId;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
}

const CampaignSchema = new Schema<ICampaign>({
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  title: { type: String, required: true },
  description: { type: String },
  platforms: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Draft', 'Planning', 'Active', 'Paused', 'Completed', 'Cancelled'], default: 'Active' },
  managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' }
}, { timestamps: true });

// 8. CampaignEmployee Relationship Schema
export interface ICampaignEmployee extends Document {
  campaignId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  role: string;
  assignedBy?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate?: Date;
  status: 'Active' | 'Completed' | 'Removed';
}

const CampaignEmployeeSchema = new Schema<ICampaignEmployee>({
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  role: { type: String, default: 'Content Creator' },
  assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Removed'], default: 'Active' }
}, { timestamps: true });

// 9. Task / Content Schema
export interface ITask extends Document {
  taskId: string;
  employeeId: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  platform: string;
  contentType: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  scheduledDate: Date;
  scheduledTime: string; // e.g. "10:00 AM"
  deadline: Date;
  status: 'Pending' | 'In Progress' | 'Submitted' | 'Verified' | 'Rejected' | 'Delayed' | 'Missed';
  publishedUrl?: string;
  publishedDate?: Date;
  verificationStatus: 'Unsubmitted' | 'Pending Verification' | 'Verified' | 'Rejected';
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  comments?: string;
}

const TaskSchema = new Schema<ITask>({
  taskId: { type: String, required: true, unique: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
  campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
  platform: { type: String, required: true },
  contentType: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Submitted', 'Verified', 'Rejected', 'Delayed', 'Missed'], 
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
  comments: { type: String }
}, { timestamps: true });

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

// Export Models
export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
export const Role = mongoose.model<IRole>('Role', RoleSchema);
export const User = mongoose.model<IUser>('User', UserSchema);
export const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
export const EmployeeBrand = mongoose.model<IEmployeeBrand>('EmployeeBrand', EmployeeBrandSchema);
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export const CampaignEmployee = mongoose.model<ICampaignEmployee>('CampaignEmployee', CampaignEmployeeSchema);
export const Task = mongoose.model<ITask>('Task', TaskSchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
