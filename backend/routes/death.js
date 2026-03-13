const router = require('express').Router();
const upload = require('../middleware/upload');
const {
  submitDeathRequest,
  getNomineeRequestStatus,
} = require('../controllers/deathController');

// ── Public routes — no auth required ──────────────
// Nominees use their nomineeAccessToken to authenticate
router.post('/request',        upload.single('certificate'), submitDeathRequest);
router.get('/nominee-status',  getNomineeRequestStatus);

module.exports = router;
