const {Campaign} = require('../models');

// Create a new campaign
const createCampaign = async (data) => {
  const campaign = new Campaign(data);
  return await campaign.save();
};

// Get all campaigns
const getAllCampaigns = async () => {
  return await Campaign.find();
};

// Get a specific campaign by ID
const getCampaignById = async (id) => {
  return await Campaign.findById(id);
};

// Update a campaign by ID
const updateCampaign = async (id, data) => {
  return await Campaign.findByIdAndUpdate(id, data, { new: true });
};

// Delete a campaign by ID
const deleteCampaign = async (id) => {
  return await Campaign.findByIdAndDelete(id);
};

module.exports = {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign
};
