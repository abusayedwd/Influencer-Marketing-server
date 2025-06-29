const httpStatus = require('http-status');
const response = require('../config/response');
const {withdrawalService} = require('../services'); // Adjust path as needed
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');

// Request Withdrawal (Influencer)
const requestWithdrawal = async (req, res) => {
  try {
    const { influencerId } = req.params;
    const { amount, bankDetails, reason } = req.body;

    // Validate the input (amount, bank details, and reason can be optional or required based on your use case)
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Call the service to handle the withdrawal request
    const withdrawalRequest = await withdrawalService.requestWithdrawal(
      influencerId, 
      amount, 
      bankDetails, 
      reason
    );

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
const getAllWithdrawalRequests = catchAsync(async (req, res) => { 

  const filter = pick(req.query, ['fullName', 'bankName', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const withdrawalRequests = await withdrawalService.getAllWithdrawalRequests(filter,options);
     res.status(httpStatus.OK).json(
    response({
      message: 'get all withdraw request',
      status: 'OK',
      statusCode: httpStatus.OK,
      data: withdrawalRequests,
    })
  );
 
});

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
