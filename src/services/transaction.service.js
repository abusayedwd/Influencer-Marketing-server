
// services/transactionService.js

const httpStatus = require("http-status");
const { populate } = require("../models/campaign.model");
const Transaction = require("../models/trancsaction.model");
const ApiError = require("../utils/ApiError");

 

const createTransaction = async (transactionData) => {

    const { campaignId, brandId, amount, transactionId, } = transactionData;
  try {
    const transaction = new Transaction({
      campaignId,
      brandId,
      amount, 
      transactionId,
      paymentStatus: 'completed', // Assuming the payment is completed
    });

    // Save the transaction
    const savedTransaction = await transaction.save();
    return savedTransaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw new Error("Error creating transaction");
  }
}; 

// Get all transactions
const getAllTransactions = async (filter, options) => {
  const query = {};

  // Loop through each key in the filter object
  for (const key of Object.keys(filter)) {
    if (filter[key] !== "") {
      if (key === "planName" || key === "price" || key === "status") {
        // Use regex for partial matching and case-insensitive search
        query[key] = { $regex: new RegExp(filter[key], 'i') };
      } else if (key === "price") {
        // Handle price as a number (if you want a numeric range)
        query[key] = { $gte: parseFloat(filter[key]) }; // Example: greater than or equal to
      } else {
        // For other fields, use the direct filter value
        query[key] = filter[key];
      }
    }
  }

 
    // Use pagination and populate for related fields
const transactions = await Transaction.paginate(query, {
  ...options,
  populate: ['campaignId', 'brandId fullName email phone phoneNumber'],
});
    return transactions;
  
};


// Get a transaction by its ID
const getTransactionById = async (id) => {
   
    const transaction = await Transaction.findById(id).populate('campaignId brandId');
    if (!transaction) {
      throw new ApiError(httpStatus.NOT_FOUND, "transaction not found")
    }
    return transaction;
 
};

// Delete a transaction by its ID
const deleteTransaction = async (id) => {
 
    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      throw new Error("Transaction not found");
    }
    return transaction; 
};

module.exports = { createTransaction, getAllTransactions, getTransactionById, deleteTransaction };




 
