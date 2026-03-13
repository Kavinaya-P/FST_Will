const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, registerRules, loginRules } = require('../middleware/validators');
const {
  register,
  verifyEmail,
  resendVerificationOtp,
  login,
  verifyLoginOtp,
  getMe,
} = require('../controllers/authController');

// Public routes
router.post('/register',             authLimiter, registerRules, validate, register);
router.post('/verify-email',         authLimiter, verifyEmail);
router.post('/resend-verification',  authLimiter, resendVerificationOtp);
router.post('/login',                authLimiter, loginRules, validate, login);
router.post('/verify-login-otp',     authLimiter, verifyLoginOtp);

// Protected
router.get('/me', authenticate, getMe);

module.exports = router;
