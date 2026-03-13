const mongoose = require('mongoose');

const nomineeSchema = new mongoose.Schema({
  vaultOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fullName:     { type: String, required: true, trim: true },
  email:        { type: String, required: true, lowercase: true, trim: true },
  relationship: { type: String, trim: true },
  priorityLevel: {
    type: Number,
    enum: [1, 2], // 1 = primary, 2 = secondary
    default: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'inactive'],
    default: 'pending',
  },
  // Token used to accept/decline nomination (emailed to nominee)
  invitationToken:  { type: String, default: null },
  invitationExpiry: { type: Date,   default: null },

  // Persistent token used for nominee portal access (stays valid after acceptance)
  nomineeAccessToken: { type: String, default: null },

  nomineeUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  phone: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Nominee', nomineeSchema);
