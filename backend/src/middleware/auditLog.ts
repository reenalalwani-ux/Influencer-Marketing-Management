import { AuditLog } from '../models/allModels';

export const logActivity = async (params: {
  userId?: any;
  userName: string;
  action: string;
  module: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
}) => {
  try {
    await AuditLog.create({
      userId: params.userId,
      userName: params.userName,
      action: params.action,
      module: params.module,
      entity: params.entity,
      entityId: params.entityId,
      oldValue: params.oldValue,
      newValue: params.newValue,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog] Failed to log activity:', err);
  }
};
