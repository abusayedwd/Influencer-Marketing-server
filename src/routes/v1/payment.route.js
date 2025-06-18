const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const { createPlanPayment, stripeWebhook } = require('../../controllers/payment.controller');

// CRITICAL: Webhook route must be defined BEFORE any global JSON middleware
// and must use express.raw() to preserve the raw body for Stripe signature verification
router.post('/webhook-subscription', 
  express.raw({ type: 'application/json' }), 
  stripeWebhook
);

// Other routes (these can use normal JSON parsing)
router.post('/pay', auth('common'), createPlanPayment);

module.exports = router;