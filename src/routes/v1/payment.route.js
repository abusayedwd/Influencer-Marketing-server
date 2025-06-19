const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { createPlanPayment, stripeWebhook } = require('../../controllers/payment.controller');
const auth = require('../../middlewares/auth');

// CRITICAL: Webhook route must be defined BEFORE any global JSON middleware
router.post('/webhook-subscription',
  bodyParser.raw({ type: 'application/json' }),  // Ensure that raw body is passed to the webhook
  stripeWebhook
);

// Other routes for payment, such as creating a plan payment
router.post('/pay',auth('common'), createPlanPayment);

module.exports = router;
