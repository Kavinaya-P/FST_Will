const router = require('express').Router();
const { authenticateAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { adminLogin, adminVerifyOtp, createAdmin, getAdminMe } = require('../controllers/adminController');
const {
  getAllRequests,
  getRequest,
  approveRequest,
  rejectRequest,
  downloadCertificate,
} = require('../controllers/deathController');

// ── Admin Auth ──────────────────────────────────────
router.post('/auth/login',       authLimiter, adminLogin);
router.post('/auth/verify-otp',  authLimiter, adminVerifyOtp);
router.post('/auth/create',      createAdmin);  // protected by x-setup-key header

// Protected admin routes (require admin JWT)
router.use(authenticateAdmin);

router.get('/auth/me', getAdminMe);

// Death certificate management
router.get('/death/requests',                     getAllRequests);
router.get('/death/requests/:id',                 getRequest);
router.post('/death/requests/:id/approve',        approveRequest);
router.post('/death/requests/:id/reject',         rejectRequest);
router.get('/death/certificate/:filename',        downloadCertificate);

module.exports = router;
