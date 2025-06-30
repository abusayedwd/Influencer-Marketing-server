const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const auth = require('../../middlewares/auth');
const { subscriptionController, campaignController } = require('../../controllers');

// CRITICAL: Webhook route must be defined BEFORE any global JSON middleware
router.post('/webhook-subscription',
  bodyParser.raw({ type: 'application/json' }),  // Ensure that raw body is passed to the webhook
  subscriptionController.stripeWebhook
);

router.post('/webhook-createCampaign',
  bodyParser.raw({ type: 'application/json' }),  // Ensure that raw body is passed to the webhook
  campaignController.stripeCampaignWebhook
);


router.get("/getAllSubscriptions", auth("common"),subscriptionController.getAllSubscriptions);

router.get('/getSubscription/:id', auth('common'), subscriptionController.getSubscriptionById);

router.get("/getMySubscription", auth("common"),subscriptionController.getMySubscriptions);

// Other routes for payment, such as creating a plan payment
router.post('/pay',auth('common'), subscriptionController.createPlanPayment);

module.exports = router; 
