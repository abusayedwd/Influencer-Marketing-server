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
const transactionController = require("./transaction.controller");
const DraftApprove = require("../models/draft.model");
 
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
  
      // Convert startDate and endDate from string to Date objects for proper comparison
      const currentDate = new Date();
      const parsedStartDate = new Date(startDate);  // Convert startDate string to Date object
      const parsedEndDate = new Date(endDate);      // Convert endDate string to Date object

      console.log("Parsed Start Date: ", parsedStartDate);
      console.log("Parsed End Date: ", parsedEndDate);

      // Determine the status based on start and end dates
      let status = "upComming"; // Default status
      if (currentDate >= parsedStartDate && currentDate <= parsedEndDate) {
        status = "active";
      } else if (currentDate > parsedEndDate) {
        status = "completed";
      }

      // Create the campaign in the database with the correct status
      const campaignData = {
        budget, // Convert back to original amount (in EUR, USD, etc.)
        brandId,
        campaignName,
        description,
        endDate: parsedEndDate,
        influencerCount,
        selectedPlatforms,
        startDate: parsedStartDate,
        totalAmount, 
        image,  // Use the image URL from metadata
        status, // Set the correct status here
      };

      // Create and save the campaign to the database
      const campaign = await campaignService.createCampaign(campaignData);
      console.log(campaign)
      // Ensure campaign status is updated before saving
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

 
 


const updateCampaign = catchAsync(async (req, res) => {
  const { campaignId } = req.params; // Extract campaignId from URL parameter

  const { budget, campaignName,description, endDate, influencerCount, selectedPlatforms, startDate, totalAmount } = req.body;
 
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


 

   const updatedData = {
       budget,  
       campaignName,
       image:image.url,
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

const getMyCampaigns = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['campaignName', 'status', 'budget']); // Picking filters from query params
  const options = pick(req.query, ['sortBy', 'limit', 'page']); // Picking pagination and sorting options

  const brandId = req.user?.id; // Assuming the logged-in user's ID is stored in req.user.id
  if (!brandId) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: "fail",
      message: "Brand ID is missing or invalid"
    });
  }

  // Get campaigns for the brand using the service function
  const myCampaigns = await campaignService.getMyCampaigns(brandId, filter, options);

  // Return the campaigns in the response
  res.status(httpStatus.OK).json(
    response({
      status: "success",
      message: "Successfully retrieved campaigns",
      statusCode: httpStatus.OK,
      data: myCampaigns,
    })
  );
});
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

  

const showInterest = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const  influencerId  = req.user.id;
    const campaign = await campaignService.showInterest(campaignId, influencerId);
    res.status(200).json({ message: "Interest shown successfully", code:200, campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUpcomingCampaignsForInfluecer = catchAsync(async (req, res) => {
 
  const filter = pick(req.query, ['campaignName', 'status', 'budget','brandId']); 
 
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
    // Call the service to get campaigns with 'upComming' status
    const campaigns = await campaignService.getUpcomingCampaignsForInfluecer(filter, options);
    
    // Return the result as JSON
    res.status(200).json(
       response({
      message: 'get all Upcomming campaign request',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: campaigns,
    })
    ); 
});

// Controller function to get campaigns that an influencer is interested in
const getInterestedCampaignsForInfluencer = catchAsync(async (req, res) => {
  const  influencerId  = req.user.id;  // Get influencerId from the request parameters
    const filter = pick(req.query, ['campaignName', 'status', 'budget','brandId']); 
 
  const options = pick(req.query, ['sortBy', 'limit', 'page']); // Get filter and option (pagination) from the request body

 
    // Call the service to get the campaigns
    const campaigns = await campaignService.getInterestedCampaignsForInfluencer(influencerId, filter, options);

    // Return the campaigns in the response
       res.status(200).json(
       response({
      message: 'get all interested campaign request',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: campaigns,
    })
    ); 

 
});

const getAcceptedCampaignsForInfluencer = catchAsync(async (req, res) => {
  const influencerId = req.user.id;  // Get influencerId from the request parameters
    const filter = pick(req.query, ['campaignName', 'status', 'budget','brandId']); 
 
  const options = pick(req.query, ['sortBy', 'limit', 'page']); // Get filter and option (pagination) from the request body

 
    // Call the service to get the campaigns where the influencer is accepted
    const campaigns = await campaignService.getAcceptedCampaignsForInfluencer(influencerId, filter, options);

    // Return the campaigns in the response
       res.status(200).json(
       response({
      message: 'get all accepted campaign request',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: campaigns,
    })
    ); 
 
});




// Brand accepts an influencer
const acceptInfluencer = catchAsync(async (req, res) => {
 
    const { campaignId } = req.params;
    const { influencerId } = req.body;
    const campaign = await campaignService.acceptInfluencer(campaignId, influencerId);
    res.status(200).json({ message: "Influencer accepted", code:200, campaign }); 
});

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
 
 
const submitDraft = catchAsync(async (req, res) => {
  try {
    const { campaignId } = req.params;
    const influencerId = req?.user?.id;
    const { draftContent, socialPlatform } = req.body;

    // File image handling
    const image = {};
    if (req.file) {
      image.url = "/uploads/users/" + req.file.filename;
      image.path = req.file.path;
    }

    // Require image
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Parse platforms from JSON string (if sent as JSON string)
    let platforms;
    try {
      platforms = JSON.parse(socialPlatform);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid socialPlatform format' });
    }

    // Submit draft via service
    const campaign = await campaignService.submitDraft(
      campaignId,
      influencerId,
      draftContent,
      image,
      platforms
    );

    



    res.status(200).json({ message: 'Draft submitted successfully',code: 200, campaign });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});




const approveDraft = catchAsync(async (req, res) => {
 
    const { campaignId, draftId } = req.body; // Accept campaignId and draftId as params
    // Accept the budget value from the request (for the influencer)

    const campaign = await campaignService.approveDraftAndAddBudget(campaignId, draftId);

    res.status(200).json({ message: "Draft approved and budget added to wallet", code:200, campaign });
  
});

const getMydraft = catchAsync(async(req, res)=> {
  const influencerId = req.user.id
  const drafts = await DraftApprove.find({influencerId})
  res.status(httpStatus.OK).json({
    message: "get success",
    code : httpStatus.OK,
    data: drafts
  })
}

)


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
  stripeCampaignWebhook,
  getUpcomingCampaignsForInfluecer,
  getInterestedCampaignsForInfluencer,
  getAcceptedCampaignsForInfluencer,
  getMydraft
};
