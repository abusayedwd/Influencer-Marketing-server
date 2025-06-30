 


const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
 
const userFileUploadMiddleware = require("../../middlewares/fileUpload");
const convertHeicToPngMiddleware = require("../../middlewares/converter");
const { campaignController } = require("../../controllers");
const bodyParser = require("body-parser");
const UPLOADS_FOLDER_USERS = "./public/uploads/users";

const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

const router = express.Router();


router.post("/createCampaign",auth('brand'),
     [uploadUsers.single("image")],
     convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
     campaignController.createCampaign);

// router.post('/webhook-createCampaign',auth('brand'), campaignController.stripeWebhook);   



router.get('/getAllCampaigns',auth('common'), campaignController.getAllCampaigns);

router.get('/getMy-Campaigns',auth('common'), campaignController.getMyCampaigns);

router.post('/interested/:campaignId',auth('influencer'), campaignController.showInterest);

router.post('/acceptInfluencer/:campaignId',auth('brand'), campaignController.acceptInfluencer);
router.post('/denyInfluencer/:campaignId',auth('brand'), campaignController.denyInfluencer);

router.post('/submitDraft/:campaignId',auth('influencer'),
     [uploadUsers.single("image")],
     convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
    campaignController.submitDraft);

router.post('/approveDraft',auth('brand'), campaignController.approveDraft); 

router.get('/:campaignId',auth('common'), campaignController.getCampaignDetails); 
 

// router
//   .route("/:id")
//   .get(auth("common"), 
//   campaignController.getCampaignById)
//   .patch(
//     auth("common"),
//     [uploadUsers.single("image")],
//     convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
    
//     campaignController.updateCampaign
//   )
//   .delete(auth("common"), campaignController.deleteCampaign); 

module.exports = router;
