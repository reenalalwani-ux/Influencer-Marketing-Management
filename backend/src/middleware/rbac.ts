import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const checkPermission = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Super Admin has all permissions automatically
    if (req.user.role === 'Super Admin') {
      return next();
    }

    const permissions = req.userPermissions || [];
    if (!permissions.includes(requiredPermission)) {
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
