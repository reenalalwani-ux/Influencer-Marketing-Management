import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ROLE_DEFAULT_PERMISSIONS } from '../config/constants';

export const checkPermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super Admin & Admin have all permissions automatically
    if (req.user.role === 'Super Admin' || req.user.role === 'Admin') {
      return next();
    }

    const permissions = req.userPermissions || [];
    const defaultRolePerms = ROLE_DEFAULT_PERMISSIONS[req.user.role] || [];

    if (!permissions.includes(requiredPermission) && !defaultRolePerms.includes(requiredPermission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Missing required permission '${requiredPermission}'` 
      });
    }

    next();
  };
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource` 
      });
    }

    next();
  };
};
