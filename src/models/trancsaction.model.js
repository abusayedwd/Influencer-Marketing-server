

// models/Transaction.js

 
const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const transactionSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, 
    ref: 'Campaign', 
    required: true 
},
  brandId: 
  { type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  amount: { 
    type: Number, 
    required: true 
},
  transactionDate: { 
    type: Date, 
    default: Date.now
 },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'completed' 
}, 
  transactionId: {
    type: Object, 
    required: true 
},
  // Unique Stripe Transaction ID or similar
}, 
{ timestamps: true }
);


transactionSchema.plugin(toJSON)
transactionSchema.plugin(paginate)

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
