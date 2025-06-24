const { campaignService } = require("../services");

 

// Create a new campaign
const createCampaign = async (req, res) => {
  try {
    const data = req.body;
    const newCampaign = await campaignService.createCampaign(data);
    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all campaigns
const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignService.getAllCampaigns();
    res.status(200).json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific campaign by ID
const getCampaignById = async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(200).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a campaign by ID
const updateCampaign = async (req, res) => {
  try {
    const updatedCampaign = await campaignService.updateCampaign(req.params.id, req.body);
    if (!updatedCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(200).json(updatedCampaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a campaign by ID
const deleteCampaign = async (req, res) => {
  try {
    const deletedCampaign = await campaignService.deleteCampaign(req.params.id);
    if (!deletedCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign
};
