// const {Campaign} = require('../models');

// // Create a new campaign
// const createCampaign = async (data) => {
//   const campaign = new Campaign(data);
//   return await campaign.save();
// };

// // Get all campaigns
// const getAllCampaigns = async () => {
//   return await Campaign.find();
// };

// // Get a specific campaign by ID
// const getCampaignById = async (id) => {
//   return await Campaign.findById(id);
// };

// // Update a campaign by ID
// const updateCampaign = async (id, data) => {
//   return await Campaign.findByIdAndUpdate(id, data, { new: true });
// };

// // Delete a campaign by ID
// const deleteCampaign = async (id) => {
//   return await Campaign.findByIdAndDelete(id);
// };

// module.exports = {
//   createCampaign,
//   getAllCampaigns,
//   getCampaignById,
//   updateCampaign,
//   deleteCampaign
// };



const {Campaign} = require('../models');
const {User} = require('../models');
const DraftApprove = require('../models/draft.model');
const { populate } = require('../models/service.model');
const Wallet = require('../models/wallet.model');
const WithdrawalRequest = require('../models/withdrawal.model');
const catchAsync = require('../utils/catchAsync');

// Create a new campaign
const createCampaign = async (data) => {
  try {
    const campaign = new Campaign(data);
    await campaign.save();
    return campaign;
  } catch (error) {
    throw new Error('Error creating campaign');
  }
};

 const getAllCampaigns =  async(filter, option) => {
   const query = {};

  for (const key of Object.keys(filter)) {
    if (
      (key === "campaignName" || key === "status" || key === "budget") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

   const campaigns = await Campaign.paginate(query, {
      ...option,
      populate: "brandId",
   }) ;
   return campaigns
 };


const getMyCampaigns = async (brandId, filter, options) => {
 
  const query = { brandId}; // Add userId to the query to filter by brandId

  // Process the filter object to add other search criteria (like campaignName, status, etc.)
  for (const key of Object.keys(filter)) {
    if (
      (key === "campaignName" || key === "status" || key === "budget") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  // Now, we pass the `query` and `options` to paginate
  const campaigns = await Campaign.paginate(query,{
    ...options,
    populate: "brandId",
    select:"fullName"
  } ); 
  return campaigns;
};



// Get campaign details along with interested and accepted influencers
const getCampaignDetails = async (campaignId) => {
  try {
    const campaign = await Campaign.findById(campaignId)
      .populate('brandId')
      .populate('interestedInfluencers')
      .populate('acceptedInfluencers')
      .exec();

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return campaign;
  } catch (error) {
    throw new Error('Error fetching campaign details');
  }
};

// Influencer shows interest in the campaign
const showInterest = async (campaignId, influencerId) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.interestedInfluencers.includes(influencerId)) {
      throw new Error('Influencer already showed interest');
    }

    campaign.interestedInfluencers.push(influencerId);
    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error showing interest');
  }
};

// Brand accepts an influencer
const acceptInfluencer = async (campaignId, influencerId) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.acceptedInfluencers.length >= campaign.influencerCount) {
      throw new Error('Cannot accept more influencers');
    }

    if (!campaign.interestedInfluencers.includes(influencerId)) {
      throw new Error('Influencer did not show interest');
    }

    // Accept influencer and move from interested to accepted
    campaign.acceptedInfluencers.push(influencerId);
    campaign.interestedInfluencers = campaign.interestedInfluencers.filter(id => id.toString() !== influencerId.toString());

    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error accepting influencer');
  }
};

const denyInfluencer = async (campaignId, influencerId) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.interestedInfluencers.includes(influencerId)) {
      throw new Error('Influencer not in the interested list');
    }

    // Remove the influencer from the interested list
    campaign.interestedInfluencers = campaign.interestedInfluencers.filter(id => id.toString() !== influencerId.toString());

    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error denying influencer');
  }
};

// Influencer submits a draft
// const submitDraft = async (campaignId, influencerId, draftContent) => {
//   try {
//     const campaign = await Campaign.findById(campaignId);

//     if (!campaign) {
//       throw new Error('Campaign not found');
//     }

//     if (!campaign.acceptedInfluencers.includes(influencerId)) {
//       throw new Error('Influencer not accepted for this campaign');
//     }

//     // Add the draft submitted by the influencer
//     campaign.drafts.push({ influencerId, draftContent });
//     await campaign.save();

//     return campaign;
//   } catch (error) {
//     throw new Error('Error submitting draft');
//   }
// };

const submitDraft = async (campaignId, influencerId, draftContent, image, socialPlatform) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.acceptedInfluencers.includes(influencerId)) {
      throw new Error('Influencer not accepted for this campaign');
    }

    // Add the draft submitted by the influencer
    campaign.drafts.push({
      influencerId,
      draftContent,
      image: image, // Save the image file path
      socialPlatform, // Save the social platform
    });
    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error submitting draft');
  }
};



const approveDraftAndAddBudget = async (campaignId, draftId) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Find the draft by its ID
    const draft = campaign.drafts.id(draftId);

    if (!draft) {
      throw new Error('Draft not found');
    }

    // Approve the draft
    draft.isApproved = true;

    // Get the budget from the campaign or set a fixed budget
    const budget = campaign.budget;  // Example: a fixed budget per influencer in the campaign

    // Add the budget to the influencer's wallet
    const influencer = await User.findById(draft.influencerId);

    if (!influencer) {
      throw new Error('Influencer not found');
    }

    // Find the influencer's wallet or create one if it doesn't exist
    let wallet = await Wallet.findOne({ influencerId: draft.influencerId });

    if (!wallet) {
      wallet = new Wallet({ influencerId: draft.influencerId });
    }

    // Add the budget to the wallet balance
    wallet.balance += budget;

    // Record the transaction in the wallet
    wallet.transactions.push({
      amount: budget,
      type: 'deposit',
      description: 'Budget added after draft approval'
    });

    // Save the wallet
    await wallet.save();

    // Create a record in the DraftApprove model
    const draftApproval = new DraftApprove({
      campaignId,
      draftId,
      influencerId: draft.influencerId,
      budget,
      isApproved: true
    });

    await draftApproval.save();

    // Save the campaign with the approved draft
    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error approving draft and adding budget');
  }
};


// // To handle the withdrawal request
// const requestWithdrawal = async (influencerId, amount) => {
//   try {
//     // Find influencer and wallet
//     const influencer = await User.findById(influencerId);
//     if (!influencer) {
//       throw new Error('Influencer not found');
//     }

//     const wallet = await Wallet.findOne({ influencerId });
//     if (!wallet) {
//       throw new Error('Wallet not found');
//     }

//     // Check if the influencer has enough funds
//     if (wallet.balance < amount) {
//       throw new Error('Insufficient funds');
//     }

//     // Create a withdrawal request
//     const withdrawalRequest = new WithdrawalRequest({
//       influencerId,
//       amount,
//       status: 'pending' // Default status is pending
//     });

//     // Save the withdrawal request
//     await withdrawalRequest.save();

//     return withdrawalRequest;
//   } catch (error) {
//     throw new Error('Error processing withdrawal request: ' + error.message);
//   }
// };


// Admin approves the withdrawal
// const approveWithdrawal = async (requestId) => {
//   try {
//     // Find the withdrawal request
//     const request = await WithdrawalRequest.findById(requestId);
//     if (!request) {
//       throw new Error('Withdrawal request not found');
//     }

//     // Check if the withdrawal request is still pending
//     if (request.status !== 'pending') {
//       throw new Error('Withdrawal request already processed');
//     }

//     // Find the influencer and their wallet
//     const influencer = await User.findById(request.influencerId);
//     if (!influencer) {
//       throw new Error('Influencer not found');
//     }

//     const wallet = await Wallet.findOne({ influencerId: influencer._id });
//     if (!wallet) {
//       throw new Error('Wallet not found');
//     }

//     // Deduct the requested amount from the wallet balance
//     if (wallet.balance < request.amount) {
//       throw new Error('Insufficient funds in the wallet');
//     }

//     wallet.balance -= request.amount;

//     // Record the withdrawal transaction in the wallet
//     wallet.transactions.push({
//       amount: request.amount,
//       type: 'withdrawal',
//       description: `Withdrawal approved by admin`,
//     });

//     // Mark the withdrawal request as approved
//     request.status = 'approved';

//     // Save the updated wallet and withdrawal request
//     await wallet.save();
//     await request.save();

//     return request;
//   } catch (error) {
//     throw new Error('Error approving withdrawal: ' + error.message);
//   }
// };



module.exports = {
  createCampaign,
  getCampaignDetails,
  showInterest,
  acceptInfluencer,
  denyInfluencer,
  submitDraft,
  approveDraftAndAddBudget,
 
  getAllCampaigns,
  getMyCampaigns
};
