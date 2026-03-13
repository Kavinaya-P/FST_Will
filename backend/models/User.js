const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: 2,
    maxlength: 255,
  },

  // ── Email Verification (sent after registration) ────
  emailVerification: {
    otp:      { type: String, select: false, default: null },
    expiry:   { type: Date,   select: false, default: null },
    verified: { type: Boolean, default: false },
  },

  // ── Login OTP (sent on every login after password) ──
  loginOtp: {
    otp:    { type: String, select: false, default: null },
    expiry: { type: Date,   select: false, default: null },
  },

  status: {
    type: String,
    enum: ['pending_verification', 'active', 'inactive', 'deceased', 'suspended'],
    default: 'pending_verification',
  },
  lastLogin:   { type: Date },
  lastCheckin: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.emailVerification;
    delete ret.loginOtp;
    delete ret.__v;
    return ret;
  }
});

userSchema.methods.comparePassword = async function (plaintext) {
  return bcrypt.compare(plaintext, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
