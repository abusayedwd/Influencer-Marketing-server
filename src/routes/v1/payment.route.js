const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const auth = require('../../middlewares/auth');
const { subscriptionController, campaignController } = require('../../controllers');
const transactionController = require("../../controllers/transaction.controller")
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



//Transaction Route heare,
router.get('/get-transactions',auth("common"), transactionController.getAllTransactions);

// Get transaction by ID
router.get('/transaction/:id',auth("common"), transactionController.getTransactionById);

 
router.get('/getTransactionById/:id',auth("common"), transactionController.getTransactionById);

router.delete('/deleteTransaction/:id',auth("common"), transactionController.deleteTransaction);



module.exports = router; 
