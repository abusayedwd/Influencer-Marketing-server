// const express = require('express');
// const router = express.Router();
// const campaignController = require('../controllers/campaignController');

// // Create a new campaign
// router.post('/', campaignController.createCampaign);

// // Get all campaigns
// router.get('/', campaignController.getAllCampaigns);

// // Get a specific campaign by ID
// router.get('/:id', campaignController.getCampaignById);

// // Update a campaign by ID
// router.put('/:id', campaignController.updateCampaign);

// // Delete a campaign by ID
// router.delete('/:id', campaignController.deleteCampaign);

// module.exports = router;


const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
 
const userFileUploadMiddleware = require("../../middlewares/fileUpload");
const convertHeicToPngMiddleware = require("../../middlewares/converter");
const { campaignController } = require("../../controllers");
const UPLOADS_FOLDER_USERS = "./public/uploads/users";

const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);

const router = express.Router();


router.post("/createCampaign",auth('brand'),
     [uploadUsers.single("image")],
     convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
     campaignController.createCampaign);

router.get('/',auth('common'), campaignController.getAllCampaigns);
 

router
  .route("/:id")
  .get(auth("common"), 
  campaignController.getCampaignById)
  .patch(
    auth("common"),
    [uploadUsers.single("image")],
    convertHeicToPngMiddleware(UPLOADS_FOLDER_USERS),
    
    campaignController.updateCampaign
  )
  .delete(auth("common"), campaignController.deleteCampaign); 

module.exports = router;
