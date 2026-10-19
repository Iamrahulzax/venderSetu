import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User, IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const generateToken = (userId: string, role: string, assignedStoreId?: string | null): string => {
  return jwt.sign({ id: userId, role, assignedStoreId: assignedStoreId || null }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any
  });
};

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; role: string };
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found or token invalid.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account suspended. Contact campus administrator.' });
      return;
    }

    if (user.role === 'seller' && !user.isApproved) {
      res.status(403).json({ success: false, message: 'Seller account pending administrator approval.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
    return;
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user.role}' is not authorized to access this resource.`
      });
      return;
    }

    next();
  };
};

// Enforces that a seller can ONLY access data belonging to their assigned store.
// Admins can access any store.
export const requireStoreOwnerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role === 'seller') {
    const targetStoreId = req.params.storeId || req.body.storeId || req.query.storeId;

    if (!targetStoreId) {
      res.status(400).json({ success: false, message: 'storeId parameter is required.' });
      return;
    }

    if (!req.user.assignedStoreId || req.user.assignedStoreId.toString() !== targetStoreId.toString()) {
      res.status(403).json({
        success: false,
        message: 'Unauthorized: You are only allowed to manage your assigned store.'
      });
      return;
    }

    return next();
  }

  res.status(403).json({ success: false, message: 'Access denied: Seller or Admin privileges required.' });
};
