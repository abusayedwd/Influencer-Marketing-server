const {withdrawalService} = require('../services'); // Adjust path as needed

// Request Withdrawal (Influencer)
const requestWithdrawal = async (req, res) => {
  try {
    const { influencerId } = req.params;
    const { amount } = req.body;

    // Call the service to handle the withdrawal request
    const withdrawalRequest = await withdrawalService.requestWithdrawal(influencerId, amount);

    res.status(200).json({
      message: "Withdrawal request submitted successfully",
      withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Approves Withdrawal
const approveWithdrawal = async (req, res) => {
  try {
    const { requestId } = req.params;  // Withdrawal request ID to approve
    const withdrawalRequest = await withdrawalService.approveWithdrawal(requestId);

    res.status(200).json({
      message: "Withdrawal request approved successfully",
      withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Withdrawal Requests (for Admin)
const getAllWithdrawalRequests = async (req, res) => {
  try {
    const withdrawalRequests = await withdrawalService.getAllWithdrawalRequests();
    res.status(200).json(withdrawalRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Withdrawal Request by ID (for Admin)
const getWithdrawById = async (req, res) => {
  try {
    const { requestId } = req.params;  // Withdrawal request ID
    const withdrawalRequest = await withdrawalService.getWithdrawById(requestId);

    if (!withdrawalRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    res.status(200).json({
      message: "Withdrawal request fetched successfully",
      withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
    requestWithdrawal, 
    approveWithdrawal, 
    getAllWithdrawalRequests ,
    getWithdrawById
};
