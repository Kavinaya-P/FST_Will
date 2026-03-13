const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const Admin = require('../models/Admin');
const { sendEmail, emailTemplates } = require('../config/email');
const { logger } = require('../config/logger');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;

const generateAdminToken = (adminId) =>
  jwt.sign({ adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

// ── POST /api/admin/auth/login ──────────────────────
// Step 1: Verify password → send email OTP
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash +loginOtp');
    if (!admin || !admin.isActive) {
      await bcrypt.hash(password, SALT_ROUNDS); // timing-safe
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Admin.findByIdAndUpdate(admin._id, {
      'loginOtp.otp': otp,
      'loginOtp.expiry': expiry,
    });

    const { subject, html } = emailTemplates.loginOtp(admin.fullName, otp);
    await sendEmail({ to: admin.email, subject, html });

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: 'Password verified. A login code has been sent to your admin email.',
      adminId: admin._id,
    });
  } catch (err) {
    logger.error('Admin login error:', err);
    return res.status(500).json({ success: false, error: 'Login failed.' });
  }
};

// ── POST /api/admin/auth/verify-otp ────────────────
// Step 2: Verify email OTP → issue admin JWT
const adminVerifyOtp = async (req, res) => {
  try {
    const { adminId, otp } = req.body;

    const admin = await Admin.findById(adminId).select('+loginOtp.otp +loginOtp.expiry');
    if (!admin) return res.status(404).json({ success: false, error: 'Admin not found.' });
    if (!admin.loginOtp?.otp || admin.loginOtp.expiry < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP expired. Please login again.' });
    }
    if (admin.loginOtp.otp !== otp.trim()) {
      return res.status(401).json({ success: false, error: 'Invalid OTP.' });
    }

    await Admin.findByIdAndUpdate(admin._id, {
      'loginOtp.otp': null,
      'loginOtp.expiry': null,
      lastLogin: new Date(),
    });

    const token = generateAdminToken(admin._id);
    const freshAdmin = await Admin.findById(admin._id);

    return res.status(200).json({
      success: true,
      token,
      admin: { id: freshAdmin._id, email: freshAdmin.email, fullName: freshAdmin.fullName },
    });
  } catch (err) {
    logger.error('Admin OTP verify error:', err);
    return res.status(500).json({ success: false, error: 'OTP verification failed.' });
  }
};

// ── POST /api/admin/auth/create ─────────────────────
// One-time: seed first admin (use only via internal script or env gate)
const createAdmin = async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'];
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }

    const { email, password, fullName } = req.body;
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(409).json({ success: false, error: 'Admin already exists.' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await Admin.create({ email, passwordHash, fullName });

    return res.status(201).json({ success: true, message: 'Admin created.', adminId: admin._id });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to create admin.' });
  }
};

// ── GET /api/admin/auth/me ──────────────────────────
const getAdminMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ success: false, error: 'Admin not found.' });
    return res.json({ success: true, admin: { id: admin._id, email: admin.email, fullName: admin.fullName } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch admin profile.' });
  }
};

module.exports = { adminLogin, adminVerifyOtp, createAdmin, getAdminMe };
