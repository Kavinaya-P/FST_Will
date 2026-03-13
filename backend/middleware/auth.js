const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// ── User authentication ─────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Session expired. Please login again.' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }

    // Must be a user token (has userId, no adminId)
    if (!decoded.userId || decoded.adminId) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const user = await User.findById(decoded.userId).select('+email +fullName +status');
    if (!user) return res.status(401).json({ success: false, error: 'User not found.' });
    if (user.status === 'suspended') return res.status(403).json({ success: false, error: 'Account suspended.' });
    if (user.status === 'pending_verification') return res.status(403).json({ success: false, error: 'Email not verified.' });

    req.user   = user;
    req.userId = user._id;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Authentication error.' });
  }
};

// ── Admin authentication ────────────────────────────
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No admin token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Admin session expired.' });
      }
      return res.status(401).json({ success: false, error: 'Invalid admin token.' });
    }

    if (!decoded.adminId || decoded.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required.' });
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return res.status(403).json({ success: false, error: 'Admin account inactive.' });
    }

    req.admin   = admin;
    req.adminId = admin._id;
    next();
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Admin authentication error.' });
  }
};

module.exports = { authenticate, authenticateAdmin };
