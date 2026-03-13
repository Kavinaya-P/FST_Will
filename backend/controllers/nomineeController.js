const crypto = require('crypto');
const Nominee = require('../models/Nominee');
const User = require('../models/User');
const { auditLog, AUDIT_ACTIONS } = require('../config/audit');
const { sendEmail, emailTemplates } = require('../config/email');

// ── GET /api/nominees ──────────────────────────────
const getNominees = async (req, res) => {
  try {
    const nominees = await Nominee.find({ vaultOwnerId: req.userId })
      .sort({ priorityLevel: 1, createdAt: 1 });
    return res.json({ success: true, nominees });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch nominees.' });
  }
};

// ── POST /api/nominees ─────────────────────────────
const addNominee = async (req, res) => {
  try {
    const { fullName, email, relationship, priorityLevel, phone } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ success: false, error: 'Full name and email are required.' });
    }

    // Max 1 primary, 1 secondary
    const existingCount = await Nominee.countDocuments({ vaultOwnerId: req.userId, priorityLevel });
    if (existingCount >= 1) {
      const label = priorityLevel === 1 ? 'primary' : 'secondary';
      return res.status(400).json({ success: false, error: `You already have a ${label} nominee. Remove them first.` });
    }

    // Prevent self-nomination
    const owner = await User.findById(req.userId);
    if (owner.email === email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'You cannot add yourself as a nominee.' });
    }

    // Invitation token (expires in 7 days, used only for accept/decline)
    const invitationToken  = crypto.randomBytes(32).toString('hex');
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Persistent nominee portal access token (never expires — tied to this nominee record)
    const nomineeAccessToken = crypto.randomBytes(40).toString('hex');

    const nomineeUser = await User.findOne({ email: email.toLowerCase() });

    const nominee = await Nominee.create({
      vaultOwnerId:     req.userId,
      fullName,
      email:            email.toLowerCase(),
      relationship,
      priorityLevel:    priorityLevel || 1,
      phone,
      invitationToken,
      invitationExpiry,
      nomineeAccessToken,
      nomineeUserId:    nomineeUser?._id || null,
    });

    // Build accept / decline URLs
    const acceptUrl  = `${process.env.FRONTEND_URL}/accept-nomination?token=${invitationToken}&action=accept`;
    const declineUrl = `${process.env.FRONTEND_URL}/accept-nomination?token=${invitationToken}&action=decline`;

    const { subject, html } = emailTemplates.nomineeInvite(fullName, owner.fullName, acceptUrl, declineUrl);
    await sendEmail({ to: email, subject, html });

    await auditLog({
      userId: req.userId,
      action: AUDIT_ACTIONS.NOMINEE_ADDED,
      metadata: { email, priorityLevel },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Nominee added. An invitation email has been sent — they must accept before they can act as nominee.',
      nominee,
    });
  } catch (err) {
    console.error('addNominee error:', err);
    return res.status(500).json({ success: false, error: 'Failed to add nominee.' });
  }
};

// ── DELETE /api/nominees/:nomineeId ───────────────
const removeNominee = async (req, res) => {
  try {
    const nominee = await Nominee.findOneAndDelete({
      _id: req.params.nomineeId,
      vaultOwnerId: req.userId,
    });
    if (!nominee) return res.status(404).json({ success: false, error: 'Nominee not found.' });

    await auditLog({
      userId: req.userId,
      action: 'NOMINEE_REMOVED',
      metadata: { nomineeId: req.params.nomineeId },
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Nominee removed.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to remove nominee.' });
  }
};

// ── POST /api/nominees/accept ──────────────────────
// Nominee clicks "Accept" link in email
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Token required.' });

    const nominee = await Nominee.findOne({ invitationToken: token });
    if (!nominee) return res.status(404).json({ success: false, error: 'Invalid or expired invitation.' });
    if (nominee.invitationExpiry < new Date()) {
      return res.status(400).json({ success: false, error: 'Invitation has expired. Ask the vault owner to re-invite you.' });
    }
    if (nominee.status === 'accepted') {
      return res.status(400).json({ success: false, error: 'Nomination already accepted.' });
    }

    await Nominee.findByIdAndUpdate(nominee._id, {
      status: 'accepted',
      invitationToken: null,
      invitationExpiry: null,
    });

    // Notify the vault owner
    const owner = await User.findById(nominee.vaultOwnerId);
    if (owner) {
      const { subject, html } = emailTemplates.nomineeAccepted(owner.fullName, nominee.fullName, nominee.email);
      await sendEmail({ to: owner.email, subject, html }).catch(() => {});
    }

    // Return the nominee portal access token so the frontend can show the portal link
    return res.json({
      success: true,
      message: 'Nomination accepted. The vault owner has been notified.',
      portalToken: nominee.nomineeAccessToken,
      portalUrl: `${process.env.FRONTEND_URL}/nominee-portal?token=${nominee.nomineeAccessToken}&owner=${encodeURIComponent(owner?.email || '')}`,
    });
  } catch (err) {
    console.error('acceptInvitation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to accept invitation.' });
  }
};

// ── POST /api/nominees/decline ─────────────────────
// Nominee clicks "Decline" link in email
const declineInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, error: 'Token required.' });

    const nominee = await Nominee.findOne({ invitationToken: token });
    if (!nominee) return res.status(404).json({ success: false, error: 'Invalid or expired invitation.' });

    await Nominee.findByIdAndUpdate(nominee._id, {
      status: 'declined',
      invitationToken: null,
      invitationExpiry: null,
    });

    // Notify the vault owner of decline
    const owner = await User.findById(nominee.vaultOwnerId);
    if (owner) {
      const { subject, html } = emailTemplates.nomineeDeclined(owner.fullName, nominee.fullName, nominee.email);
      await sendEmail({ to: owner.email, subject, html }).catch(() => {});
    }

    return res.json({ success: true, message: 'Nomination declined. The vault owner has been notified.' });
  } catch (err) {
    console.error('declineInvitation error:', err);
    return res.status(500).json({ success: false, error: 'Failed to decline invitation.' });
  }
};

// ── Used by deadman scheduler ──────────────────────
const resolveActiveNominee = async (vaultOwnerId) => {
  let nominee = await Nominee.findOne({ vaultOwnerId, priorityLevel: 1, status: 'accepted' });
  if (!nominee) nominee = await Nominee.findOne({ vaultOwnerId, priorityLevel: 2, status: 'accepted' });
  return nominee;
};

module.exports = {
  getNominees,
  addNominee,
  removeNominee,
  acceptInvitation,
  declineInvitation,
  resolveActiveNominee,
};
