import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'student', phone, studentId, hostelRoom, storeSlug } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    let assignedStoreId = null;
    let isApproved = true;

    if (role === 'seller') {
      if (storeSlug) {
        const store = await Store.findOne({ slug: storeSlug });
        if (store) {
          assignedStoreId = store._id;
        }
      }
      // New self-registered sellers require approval if not pre-seeded
      isApproved = true; // Auto-approve demo or pre-configured sellers
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: ['student', 'seller', 'admin'].includes(role) ? role : 'student',
      phone,
      studentId,
      hostelRoom,
      assignedStoreId,
      isApproved,
      status: 'active'
    });

    const token = generateToken(user._id.toString(), user.role);

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
      message: 'Account registered successfully',
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

    const user = await User.findOne({ email: email.toLowerCase() }).populate('assignedStoreId');
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

    const token = generateToken(user._id.toString(), user.role);

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

    if (!email) {
      res.status(400).json({ success: false, message: 'Google email is required.' });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() }).populate('assignedStoreId');

    if (!user) {
      // Auto-register student via Google
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: `google_oauth_${Math.random().toString(36).slice(-8)}`,
        role: 'student',
        isApproved: true,
        status: 'active'
      });
    }

    const token = generateToken(user._id.toString(), user.role);

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
