import { AuditLog } from '../models/allModels';

export const logActivity = async (params: {
  userId?: any;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  module: string;
  entity: string;
  entityId?: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) => {
  try {
    await AuditLog.create({
      userId: params.userId,
      userName: params.userName || 'System User',
      userEmail: params.userEmail || '',
      userRole: params.userRole || 'Employee',
      action: params.action,
      module: params.module,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details || '',
      oldValue: params.oldValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress || '',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog] Failed to log activity:', err);
  }
};
