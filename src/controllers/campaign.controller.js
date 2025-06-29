// const { campaignService } = require("../services");

 

// // Create a new campaign
// const createCampaign = async (req, res) => {
//   try {
//     const data = req.body;
//     const newCampaign = await campaignService.createCampaign(data);
//     res.status(201).json(newCampaign);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Get all campaigns
// const getAllCampaigns = async (req, res) => {
//   try {
//     const campaigns = await campaignService.getAllCampaigns();
//     res.status(200).json(campaigns);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Get a specific campaign by ID
// const getCampaignById = async (req, res) => {
//   try {
//     const campaign = await campaignService.getCampaignById(req.params.id);
//     if (!campaign) {
//       return res.status(404).json({ message: 'Campaign not found' });
//     }
//     res.status(200).json(campaign);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Update a campaign by ID
// const updateCampaign = async (req, res) => {
//   try {
//     const updatedCampaign = await campaignService.updateCampaign(req.params.id, req.body);
//     if (!updatedCampaign) {
//       return res.status(404).json({ message: 'Campaign not found' });
//     }
//     res.status(200).json(updatedCampaign);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Delete a campaign by ID
// const deleteCampaign = async (req, res) => {
//   try {
//     const deletedCampaign = await campaignService.deleteCampaign(req.params.id);
//     if (!deletedCampaign) {
//       return res.status(404).json({ message: 'Campaign not found' });
//     }
//     res.status(200).json({ message: 'Campaign deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = {
//   createCampaign,
//   getAllCampaigns,
//   getCampaignById,
//   updateCampaign,
//   deleteCampaign
// };


const httpStatus = require("http-status");
const {campaignService} =  require("../services");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const ApiError = require("../utils/ApiError");
const pick = require("../utils/pick");

// Create a new campaign
const createCampaign = catchAsync(async (req, res) => {
   const brandId = req.user.id;
    const { budget,  campaignName, description, endDate, influencerCount, selectedPlatforms, startDate, totalAmount } = req.body;
    // const image = req.file;  // Multer will automatically store the uploaded file info in `req.file`
   
    const image = {};
  if (req.file) {
    image.url = "/uploads/users/" + req.file.filename;
    image.path = req.file.path;
  }
  if (req.file) {
    req.body.image = image;
  }
    // Ensure file is uploaded
    if (!image) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Create campaign object
    const campaignData = {
      budget,
      brandId,
      campaignName,
      description,
      endDate,
      influencerCount,
      selectedPlatforms: selectedPlatforms.split(','),
      startDate,
      totalAmount,
      image 
    };

    const campaign = await campaignService.createCampaign(campaignData);
    res.status(httpStatus.CREATED).json(
      { status: "success",
        message: 'Campaign created successfully',
        statusCode: httpStatus.CREATED,
        campaign 
       });
  
});

const getAllCampaigns = catchAsync(async (req, res) => {

    const filter = pick(req.query, ['campaignName', 'status', 'budget']);  
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

   const campaigns = await campaignService.getAllCampaigns(filter, options)

   if(!campaigns){
     throw new ApiError(httpStatus.NOT_FOUND, "no campaign found")
   }

   res.status(httpStatus.OK).json(
     response({
      status: "success",
      statusCode: httpStatus.OK,
      message: "get All Campaignss",
      data: campaigns
     })
   )
  

} )

// Get campaign details along with interested and accepted influencers
const getCampaignDetails = catchAsync(async (req, res) => {
  
    const { campaignId } = req.params;
    const campaign = await campaignService.getCampaignDetails(campaignId);
    res.status(httpStatus.OK)
    .json(
      response({
        status: "success",
        statusCode: httpStatus.OK, 
        data: campaign
       })
      );
   
});


const getMyCampaigns = catchAsync(async (req, res) => {
  
   const filter = pick(req.query, ['campaignName', 'status', 'budget','brandId']); 
 
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const  brandId  = req.user?.id;
    const mycampaign = await campaignService.getMyCampaigns(brandId, filter, options);
    res.status(httpStatus.OK)
    .json(
      response({
        status: "success",
        message: "get My Campaigns",
        statusCode: httpStatus.OK, 
        data: mycampaign
       })
      );
   
});

// Influencer shows interest in the campaign
const showInterest = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const  influencerId  = req.user.id;
    const campaign = await campaignService.showInterest(campaignId, influencerId);
    res.status(200).json({ message: "Interest shown successfully", campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Brand accepts an influencer
const acceptInfluencer = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { influencerId } = req.body;
    const campaign = await campaignService.acceptInfluencer(campaignId, influencerId);
    res.status(200).json({ message: "Influencer accepted", campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const denyInfluencer = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { influencerId } = req.body;

    const campaign = await campaignService.denyInfluencer(campaignId, influencerId);

    res.status(200).json({ message: "Influencer denied", campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
 

const submitDraft = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const influencerId = req?.user?.id
    const { draftContent, socialPlatform } = req.body;

    // Ensure the file was uploaded
     const image = {};
  if (req.file) {
    image.url = "/uploads/users/" + req.file.filename;
    image.path = req.file.path;
  }
  if (req.file) {
    req.body.image = image;
  }
    // Ensure file is uploaded
    if (!image) {
      return res.status(400).json({ message: 'Image file is required' });
    }
 
    // const platforms = socialPlatform ? socialPlatform.split(',') : []; // If multiple platforms are sent, split them
   const platforms = JSON.parse(socialPlatform);

    const campaign = await campaignService.submitDraft(
      campaignId,
      influencerId,
      draftContent,
      image,
      platforms
    );

    res.status(200).json({ message: 'Draft submitted successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const approveDraft = async (req, res) => {
  try {
    const { campaignId, draftId } = req.body; // Accept campaignId and draftId as params
    // Accept the budget value from the request (for the influencer)

    const campaign = await campaignService.approveDraftAndAddBudget(campaignId, draftId);

    res.status(200).json({ message: "Draft approved and budget added to wallet", campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createCampaign,
  getCampaignDetails,
  showInterest,
  acceptInfluencer,
  denyInfluencer,
  submitDraft,
  approveDraft,
  getAllCampaigns,
  getMyCampaigns
};
