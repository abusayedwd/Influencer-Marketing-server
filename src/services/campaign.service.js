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
const { populate } = require('../models/service.model');
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

// Influencer submits a draft
const submitDraft = async (campaignId, influencerId, draftContent) => {
  try {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (!campaign.acceptedInfluencers.includes(influencerId)) {
      throw new Error('Influencer not accepted for this campaign');
    }

    // Add the draft submitted by the influencer
    campaign.drafts.push({ influencerId, draftContent });
    await campaign.save();

    return campaign;
  } catch (error) {
    throw new Error('Error submitting draft');
  }
};

module.exports = {
  createCampaign,
  getCampaignDetails,
  showInterest,
  acceptInfluencer,
  submitDraft,
  getAllCampaigns,
  getMyCampaigns
};
