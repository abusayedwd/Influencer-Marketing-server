// const mongoose = require('mongoose');
// const { toJSON, paginate } = require('./plugins');

// const campaignSchema = new mongoose.Schema({
//   budget: {
//     type: Number,
//     required: true
//   },
//   brandId:  {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true,
//    },
//   campaignName: {
//     type: String,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['upComming', 'active', 'completed', 'cancelled'],
//     default: 'upComming',
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   }, 
//   influencerCount: {
//     type: Number,
//     required: true
//   },
//   selectedPlatforms: {
//     type: [String],
//     required: true
//   },
//   startDate: {
//     type: Date,
//     required: true
//   }, 
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   uploadedImageFile: {
//     type: Object, // For file metadata, e.g., file name, size, etc.
//     required: true
//   }, 
// });

// campaignSchema.plugin(toJSON);
// campaignSchema.plugin(paginate);

// const Campaign = mongoose.model('Campaign', campaignSchema);

// module.exports = Campaign;



const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const campaignSchema = new mongoose.Schema({
  budget: {
    type: Number,
    required: true
  },
  brandId:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  campaignName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['upComming', 'active', 'completed', 'cancelled'],
    default: 'upComming',
  },
  description: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }, 
  influencerCount: {
    type: Number,
    required: true
  },
  selectedPlatforms: {
    type: [String],
    required: true
  },
  startDate: {
    type: String,
    required: true
  }, 
  totalAmount: {
    type: Number,
    required: true
  },
 image: {
      type: Object,
      required: [true, "Image is required"],
      default: { url: `/uploads/users/camp-1751092586149.jpg`, path: "null" },
    },
  interestedInfluencers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  acceptedInfluencers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  drafts: [{
    influencerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    draftContent: String,
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
  }],
});

campaignSchema.plugin(toJSON);
campaignSchema.plugin(paginate);

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
