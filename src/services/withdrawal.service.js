const {User,
    Wallet,
    Withdrawal
} = require('../models'); 
const { populate } = require('../models/service.model');

// Request Withdrawal (Influencer)
const requestWithdrawal = async (influencerId, amount, bankDetails, reason) => {
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
      bankDetails,  // Store bank details in the request
      reason,       // Store the reason for the withdrawal
      status: 'pending'  // Default status is pending
    });

    // Save the withdrawal request
    await withdrawalRequest.save();

    // Optionally, you can also record a notification or log for auditing purposes

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
const getAllWithdrawalRequests = async (filter, options) => {
  // Initialize an empty query object
  const query = {}; 

  // Loop through each key in the filter object
  for (const key of Object.keys(filter)) {
    if (filter[key] !== "") {
      if (key === "planName" || key === "price" || key === "status") {
        // Use regex for partial matching and case-insensitive search
        query[key] = { $regex: new RegExp(filter[key], 'i') };
      } else {
        // For other fields, use the direct filter value
        query[key] = filter[key];
      }
    }
  }

  try {
    // Paginate the requests and populate influencerId for convenience
    const requests = await Withdrawal.paginate(query, {
      ...options,  // Spread the options for pagination
      populate: 'influencerId',  // Populate influencer details
    });

    return requests;
  } catch (error) {
    // Handle any potential errors
    console.error("Error fetching withdrawal requests:", error);
    throw new Error('Failed to fetch withdrawal requests');
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
