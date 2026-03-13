const DeathRequest = require('../models/DeathRequest');
const Nominee = require('../models/Nominee');
const Vault = require('../models/Vault');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { auditLog, AUDIT_ACTIONS } = require('../config/audit');
const { sendEmail, emailTemplates } = require('../config/email');
const path = require('path');
const fs = require('fs');

// ── POST /api/death/request (Public — Nominee Portal) ──
// Nominee submits death certificate via general portal using their invitation token
const submitDeathRequest = async (req, res) => {
  try {
    const { nomineeToken, vaultOwnerEmail } = req.body;

    if (!nomineeToken || !vaultOwnerEmail) {
      return res.status(400).json({ success: false, error: 'Nominee token and vault owner email are required.' });
    }

    // Find the vault owner
    const owner = await User.findOne({ email: vaultOwnerEmail.toLowerCase() });
    if (!owner) return res.status(404).json({ success: false, error: 'Vault owner not found.' });

    // Verify nominee via their invitation token (stored at acceptance time)
    const nominee = await Nominee.findOne({
      vaultOwnerId: owner._id,
      status: 'accepted',
      nomineeAccessToken: nomineeToken,
    });

    if (!nominee) {
      return res.status(403).json({ success: false, error: 'Invalid nominee token or you are not an accepted nominee for this vault.' });
    }

    // Check for existing pending request
    const existing = await DeathRequest.findOne({ userId: owner._id, status: { $in: ['pending', 'under_review'] } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A death verification request is already pending for this vault.' });
    }

    let certificateFilePath = null;
    let certificateFileName = null;
    let certificateOriginalName = null;

    if (req.file) {
      certificateFilePath = req.file.path;
      certificateFileName = req.file.filename;
      certificateOriginalName = req.file.originalname;
    } else {
      return res.status(400).json({ success: false, error: 'Death certificate file is required.' });
    }

    const deathRequest = await DeathRequest.create({
      userId: owner._id,
      requestedByNomineeId: nominee._id,
      requestedByEmail: nominee.email,
      certificateFilePath,
      certificateFileName,
      certificateOriginalName,
    });

    await auditLog({
      userId: owner._id,
      action: AUDIT_ACTIONS.DEATH_REQUEST_SUBMITTED,
      metadata: { requestedBy: nominee.email },
      severity: 'critical',
    });

    // Notify all admins via email
    const admins = await Admin.find({ isActive: true });
    const adminPanelUrl = `${process.env.FRONTEND_URL}/admin/panel`;
    for (const admin of admins) {
      const { subject, html } = emailTemplates.adminDeathCertificateSubmitted(
        admin.fullName, nominee.fullName, owner.fullName, adminPanelUrl
      );
      await sendEmail({ to: admin.email, subject, html }).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: 'Death certificate submitted successfully. An admin will review it shortly and you will be notified by email.',
      requestId: deathRequest._id,
    });
  } catch (err) {
    console.error('submitDeathRequest error:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit death request.' });
  }
};

// ── GET /api/admin/death/requests (Admin) ──────────
const getAllRequests = async (req, res) => {
  try {
    const requests = await DeathRequest.find()
      .populate('userId', 'email fullName status')
      .populate('requestedByNomineeId', 'fullName email priorityLevel')
      .sort({ createdAt: -1 });
    return res.json({ success: true, requests });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch requests.' });
  }
};

// ── GET /api/admin/death/requests/:id (Admin) ──────
const getRequest = async (req, res) => {
  try {
    const request = await DeathRequest.findById(req.params.id)
      .populate('userId', 'email fullName status createdAt')
      .populate('requestedByNomineeId', 'fullName email priorityLevel relationship');
    if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });
    return res.json({ success: true, request });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch request.' });
  }
};

// ── POST /api/admin/death/requests/:id/approve (Admin) ─
const approveRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const request = await DeathRequest.findById(req.params.id).populate('userId');
    if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });
    if (request.status === 'approved') return res.status(400).json({ success: false, error: 'Already approved.' });

    const now = new Date();
    await DeathRequest.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      adminNotes: adminNotes || null,
      reviewedBy: req.adminId,
      reviewedAt: now,
      vaultUnlockedAt: now,
    });

    // Mark user deceased and unlock vault
    await User.findByIdAndUpdate(request.userId._id, { status: 'deceased' });
    await Vault.findOneAndUpdate({ userId: request.userId._id }, { isLocked: false });

    // Notify the requesting nominee — send vault access email
    const nominee = await Nominee.findById(request.requestedByNomineeId);
    if (nominee) {
      const portalUrl = `${process.env.FRONTEND_URL}/nominee-portal`;
      const { subject, html } = emailTemplates.vaultUnlocked(nominee.fullName, request.userId.fullName, portalUrl);
      await sendEmail({ to: nominee.email, subject, html });
    }

    await auditLog({
      userId: req.adminId,
      action: AUDIT_ACTIONS.DEATH_REQUEST_APPROVED,
      resourceId: request._id,
      metadata: { vaultOwner: request.userId.email },
      severity: 'critical',
    });

    return res.json({ success: true, message: 'Death request approved. Vault unlocked and nominee notified.' });
  } catch (err) {
    console.error('approveRequest error:', err);
    return res.status(500).json({ success: false, error: 'Failed to approve request.' });
  }
};

// ── POST /api/admin/death/requests/:id/reject (Admin) ─
const rejectRequest = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const request = await DeathRequest.findById(req.params.id)
      .populate('userId', 'fullName')
      .populate('requestedByNomineeId', 'fullName email');

    if (!request) return res.status(404).json({ success: false, error: 'Request not found.' });

    await DeathRequest.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      adminNotes: adminNotes || null,
      reviewedBy: req.adminId,
      reviewedAt: new Date(),
    });

    // Notify nominee of rejection
    if (request.requestedByNomineeId) {
      const { subject, html } = emailTemplates.deathRequestRejected(
        request.requestedByNomineeId.fullName,
        request.userId.fullName,
        adminNotes
      );
      await sendEmail({ to: request.requestedByNomineeId.email, subject, html }).catch(() => {});
    }

    await auditLog({
      userId: req.adminId,
      action: AUDIT_ACTIONS.DEATH_REQUEST_REJECTED,
      resourceId: request._id,
      severity: 'warning',
    });

    return res.json({ success: true, message: 'Death request rejected and nominee notified.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to reject request.' });
  }
};

// ── GET /api/admin/death/certificate/:filename (Admin) ─
const downloadCertificate = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.env.UPLOAD_PATH || './uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }
    return res.download(filePath);
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to download file.' });
  }
};

// ── GET /api/death/nominee-status (Public) ──────────
// Let nominee check the status of their submitted request
const getNomineeRequestStatus = async (req, res) => {
  try {
    const { nomineeToken, vaultOwnerEmail } = req.query;
    if (!nomineeToken || !vaultOwnerEmail) {
      return res.status(400).json({ success: false, error: 'nomineeToken and vaultOwnerEmail are required.' });
    }

    const owner = await User.findOne({ email: vaultOwnerEmail.toLowerCase() });
    if (!owner) return res.status(404).json({ success: false, error: 'Vault owner not found.' });

    const nominee = await Nominee.findOne({
      vaultOwnerId: owner._id,
      status: 'accepted',
      nomineeAccessToken: nomineeToken,
    });
    if (!nominee) return res.status(403).json({ success: false, error: 'Invalid nominee token.' });

    const request = await DeathRequest.findOne({ userId: owner._id, requestedByNomineeId: nominee._id })
      .sort({ createdAt: -1 });

    return res.json({ success: true, request: request ? { status: request.status, submittedAt: request.createdAt, adminNotes: request.adminNotes } : null });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch status.' });
  }
};

module.exports = {
  submitDeathRequest,
  getAllRequests,
  getRequest,
  approveRequest,
  rejectRequest,
  downloadCertificate,
  getNomineeRequestStatus,
};
