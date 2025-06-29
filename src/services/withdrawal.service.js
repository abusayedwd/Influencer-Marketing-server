const {User,
    Wallet,
    Withdrawal
} = require('../models'); 

// Request Withdrawal (Influencer)
const requestWithdrawal = async (influencerId, amount) => {
  try {
    // Find influencer and wallet
    const influencer = await User.findById(influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const wallet = await Wallet.findOne({ influencerId });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check if the influencer has enough funds
    if (wallet.balance < amount) {
      throw new Error('Insufficient funds');
    }

    // Create a withdrawal request
    const withdrawalRequest = new Withdrawal({
      influencerId,
      amount,
      status: 'pending'  // Default status is pending
    });

    // Save the withdrawal request
    await withdrawalRequest.save();

    return withdrawalRequest;
  } catch (error) {
    throw new Error('Error processing withdrawal request: ' + error.message);
  }
};

// Admin Approves Withdrawal
const approveWithdrawal = async (requestId) => {
  try {
    // Find the withdrawal request
    const request = await Withdrawal.findById(requestId);
    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    // Check if the withdrawal request is still pending
    if (request.status !== 'pending') {
      throw new Error('Withdrawal request already processed');
    }

    // Find the influencer and their wallet
    const influencer = await User.findById(request.influencerId);
    if (!influencer) {
      throw new Error('Influencer not found');
    }

    const wallet = await Wallet.findOne({ influencerId: influencer._id });
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Deduct the requested amount from the wallet balance
    if (wallet.balance < request.amount) {
      throw new Error('Insufficient funds in the wallet');
    }

    wallet.balance -= request.amount;

    // Record the withdrawal transaction in the wallet
    wallet.transactions.push({
      amount: request.amount,
      type: 'withdrawal',
      description: `Withdrawal approved by admin`
    });

    // Mark the withdrawal request as approved
    request.status = 'approved';

    // Save the updated wallet and withdrawal request
    await wallet.save();
    await request.save();

    return request;
  } catch (error) {
    throw new Error('Error approving withdrawal: ' + error.message);
  }
};

// Get All Withdrawal Requests (for Admin)
const getAllWithdrawalRequests = async () => {
  try {
    const requests = await Withdrawal.find().populate('influencerId', 'name email');  // Populate influencer details for convenience
    return requests;
  } catch (error) {
    throw new Error('Error fetching withdrawal requests: ' + error.message);
  }
};

const getWithdrawById = async (requestId) => {
  try {
    // Find the withdrawal request by ID
    const request = await WithdrawalRequest.findById(requestId).populate('influencerId', 'name email');  // Populating influencer details

    if (!request) {
      throw new Error('Withdrawal request not found');
    }

    return request;
  } catch (error) {
    throw new Error('Error fetching withdrawal request: ' + error.message);
  }
};

module.exports = { 
    requestWithdrawal, 
    approveWithdrawal, 
    getAllWithdrawalRequests,
    getWithdrawById 
};
