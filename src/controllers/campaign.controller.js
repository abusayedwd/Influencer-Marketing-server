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
const { Campaign } = require("../models");
const transactionController = require("./transaction.controller")
 
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const endpointSecret = process.env.CREATE_CAMPAIGN_WEBHOOK_SECRET;

const createCampaign = catchAsync(async (req, res) => {
  const { budget, campaignName, description, endDate, influencerCount, selectedPlatforms, startDate, totalAmount } = req.body; // Include imageUrl
  const brandId = req.user.id;
 
  
  // const imageUrl = "/uploads/users/" + image;

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


  const items = [
    {
      name: campaignName,
      quantity: 1,
    },
  ];

  // Convert totalAmount to cents
  const amount = Math.round(totalAmount * 100); // Stripe expects price in cents

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
        },
     
        unit_amount: amount,
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    success_url: `https://your-website.com/campaign-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `https://your-website.com/campaign-cancelled`,
    customer_email: req?.user?.email,
    metadata: {
      brandId,
      budget,
      campaignName,
      totalAmount,
      project: "your-project-name",
      startDate,
      endDate,
      description, // Pass description in metadata
      influencerCount,
      selectedPlatforms,
      image:image.url,
    },
  });

  res.status(httpStatus.CREATED).json({
    status: "success",
    sessionId: session.id,
    url: session.url, // Send this URL for payment
  });
});


const stripeCampaignWebhook = async (req, res) => {
  console.log("Webhook endpoint hit!");

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    if (!endpointSecret) {
      console.error("Stripe webhook secret not configured.");
      return res.status(400).json({ error: "Webhook secret not configured" });
    }

    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    console.log("Webhook verified.");

    const data = event.data.object;
    const eventType = event.type;

    console.log(`Received event type: ${eventType}`);

    if (eventType === "checkout.session.completed") {
      const session = data;
      console.log("Payment successfully completed. Session details:", session);

      // Check if the event is for the correct project
      if (session.metadata && session.metadata.project !== "your-project-name") {
        console.log("Event not for this project, ignoring...");
        return res.status(200).json({ received: true, ignored: true });
      }

      const { brandId, budget, campaignName, totalAmount, startDate, endDate, image, description, influencerCount, selectedPlatforms } = session?.metadata;
 
      // Create the campaign after payment
      const campaignData = {
        budget, // Convert back to original amount (in EUR, USD, etc.)
        brandId,
        campaignName,
        description,
        endDate,
        influencerCount,
        selectedPlatforms: selectedPlatforms.split(','), // Convert comma-separated string to an array
        startDate,
        totalAmount,
        status: "upComming", // Initially upcoming before the startDate
        image,  // Use the image URL from metadata
      };

      // Create the campaign in the database
      const campaign = await campaignService.createCampaign(campaignData);

      // Determine the status based on start and end dates
      const currentDate = new Date();
      if (currentDate >= new Date(startDate) && currentDate <= new Date(endDate)) {
        campaign.status = "active"; // Mark as active when the start date is reached
      } else if (currentDate > new Date(endDate)) {
        campaign.status = "completed"; // Mark as completed when the end date is passed
      }
  
      // Save the campaign to the database
      await campaign.save();

    

     await transactionController.createTransactionForCampaign(campaign, "Stripe", session);

      console.log("Campaign and transaction created successfully:", campaign);

      // Respond to acknowledge receipt of the event
      res.status(200).json({ received: true, eventType });
    } else {
      res.status(200).json({ received: true, ignored: true });
    }
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(200).json({ error: "Internal server error", received: true });
  }
};

 
// Controller to update campaign
const updateCampaign = catchAsync(async (req, res) => {
  const { campaignId } = req.params; // Extract campaignId from URL parameter

  const { budget, campaignName,image, description, endDate, influencerCount, selectedPlatforms, startDate, totalAmount } = req.body;
 
  const imageUrl = "/uploads/users/" + image;

   const updatedData = {
       budget, 
       campaignName,
       image: imageUrl,
       description, 
       endDate, 
       influencerCount, 
       selectedPlatforms, 
       startDate, 
       totalAmount
   }


 
    // Call the service to update the campaign
    const updatedCampaign = await campaignService.updateCampaign(campaignId, updatedData);

    // Return the updated campaign in response
    return res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: updatedCampaign,
    });
 
 
});





// const createCampaign = catchAsync(async (req, res) => {
//    const brandId = req.user.id;
//     const { budget,  campaignName, description, endDate, influencerCount, selectedPlatforms, startDate, totalAmount } = req.body;
//     // const image = req.file;  // Multer will automatically store the uploaded file info in `req.file`
   
  //   const image = {};
  // if (req.file) {
  //   image.url = "/uploads/users/" + req.file.filename;
  //   image.path = req.file.path;
  // }
  // if (req.file) {
  //   req.body.image = image;
  // }
  //   // Ensure file is uploaded
  //   if (!image) {
  //     return res.status(400).json({ message: 'Image file is required' });
  //   }

//     // Create campaign object
//     const campaignData = {
//       budget,
//       brandId,
//       campaignName,
//       description,
//       endDate,
//       influencerCount,
//       selectedPlatforms: selectedPlatforms.split(','),
//       startDate,
//       totalAmount,
//       image 
//     };

//     const campaign = await campaignService.createCampaign(campaignData);
//     res.status(httpStatus.CREATED).json(
//       { status: "success",
//         message: 'Campaign created successfully',
//         statusCode: httpStatus.CREATED,
//         campaign 
//        });
  
// });
  

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

    const brandId  = req.user?.id;
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


const approveDraft = catchAsync(async (req, res) => {
 
    const { campaignId, draftId } = req.body; // Accept campaignId and draftId as params
    // Accept the budget value from the request (for the influencer)

    const campaign = await campaignService.approveDraftAndAddBudget(campaignId, draftId);

    res.status(200).json({ message: "Draft approved and budget added to wallet", campaign });
  
});


module.exports = {
  createCampaign,
  updateCampaign,
  getCampaignDetails,
  showInterest,
  acceptInfluencer,
  denyInfluencer,
  submitDraft,
  approveDraft,
  getAllCampaigns,
  getMyCampaigns,
  stripeCampaignWebhook
};
