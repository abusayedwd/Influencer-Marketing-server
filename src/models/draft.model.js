
const mongoose = require('mongoose');

const draftApproveSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  draftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draft',
    required: true
  },
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalDate: {
    type: Date,
    default: Date.now
  }
});

const DraftApprove = mongoose.model('DraftApprove', draftApproveSchema);

module.exports = DraftApprove;
