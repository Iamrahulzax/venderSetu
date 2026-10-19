import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'student', phone, studentId, hostelRoom, storeSlug } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }

    // CRITICAL SECURITY FIX: Prevent Privilege Escalation
    // Admin role cannot be self-registered under any circumstances
    if (role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Admin accounts cannot be self-registered.'
      });
      return;
    }

    const assignedRole = role === 'seller' ? 'seller' : 'student';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    let assignedStoreId = null;
    let isApproved = true;

    if (assignedRole === 'seller') {
      if (storeSlug) {
        const store = await Store.findOne({ slug: storeSlug });
        if (store) {
          assignedStoreId = store._id;
        }
      }
      // Self-registered sellers require administrator approval
      isApproved = false;
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      phone: phone ? phone.trim() : undefined,
      studentId: studentId ? studentId.trim() : undefined,
      hostelRoom: hostelRoom ? hostelRoom.trim() : undefined,
      assignedStoreId,
      isApproved,
      status: 'active'
    });

    const token = generateToken(
      user._id.toString(),
      user.role,
      user.assignedStoreId ? user.assignedStoreId.toString() : null
    );

    // Audit log
    await AuditLog.create({
      action: 'USER_REGISTERED',
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      details: { role: user.role, email: user.email }
    });

    res.status(201).json({
      success: true,
      message: assignedRole === 'seller' && !isApproved
        ? 'Seller account registered successfully. Pending administrator verification.'
        : 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        hostelRoom: user.hostelRoom,
        assignedStoreId: user.assignedStoreId,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide both email and password.' });
      return;
    }

    // Explicitly select password since password field has select: false
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('assignedStoreId');

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Account is suspended by administrator.' });
      return;
    }

    if (user.role === 'seller' && !user.isApproved) {
      res.status(403).json({ success: false, message: 'Seller account is pending administrator approval.' });
      return;
    }

    const token = generateToken(
      user._id.toString(),
      user.role,
      user.assignedStoreId ? (user.assignedStoreId._id || user.assignedStoreId).toString() : null
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        hostelRoom: user.hostelRoom,
        assignedStoreId: user.assignedStoreId,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, googleId } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Google email is required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail }).populate('assignedStoreId');

    if (user) {
      // CRITICAL SECURITY FIX: Prevent Account Hijacking
      // High-privilege roles (admin, seller) cannot be logged into via untrusted OAuth payloads
      if (user.role === 'admin' || user.role === 'seller') {
        res.status(403).json({
          success: false,
          message: 'Security Notice: Administrator and Seller accounts must sign in using verified credentials.'
        });
        return;
      }
    } else {
      // Auto-register student via Google
      user = await User.create({
        name: name ? name.trim() : normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: `OAuth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}!`,
        role: 'student',
        isApproved: true,
        status: 'active'
      });
    }

    const token = generateToken(
      user._id.toString(),
      user.role,
      user.assignedStoreId ? (user.assignedStoreId._id || user.assignedStoreId).toString() : null
    );

    res.json({
      success: true,
      message: 'Signed in with Google',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        studentId: user.studentId,
        hostelRoom: user.hostelRoom,
        assignedStoreId: user.assignedStoreId,
        isApproved: user.isApproved
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).populate('assignedStoreId');
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, studentId, hostelRoom } = req.body;
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (studentId !== undefined) user.studentId = studentId;
    if (hostelRoom !== undefined) user.hostelRoom = hostelRoom;

    await user.save();
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
