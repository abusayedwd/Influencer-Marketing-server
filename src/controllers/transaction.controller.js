// controllers/transactionController.js

const httpStatus = require('http-status');
const transactionService = require('../services/transaction.service');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const response = require('../config/response');

const createTransactionForCampaign = async (campaign, session) => {
  try {
    const transactionData = {
      campaignId: campaign._id,
      brandId: campaign.brandId,
      amount: campaign.totalAmount, 
      transactionId:{
        transactionId:session?.payment_intent,
        paymentMethod:session?.payment_method_types,
        payment_status:session?.payment_status,
        paymentMood:session?.mode
      }
    };

    const transaction = await transactionService.createTransaction(transactionData);
    console.log("Transaction created successfully:", transaction);

    return transaction;
  } catch (error) {
    console.error("Error creating transaction for campaign:", error);
    throw new Error("Error creating transaction");
  }
}; 

// Get all transactions
const getAllTransactions = catchAsync(async (req, res) => {
 
  const filter = pick(req.query, ['paymentStatus', 'amount',]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const transactions = await transactionService.getAllTransactions(filter, options);
    res.status(httpStatus.OK).json(
        response(
            {
             staus: "success",
             messsage: "get Transaction",
             statusCode: httpStatus.OK, 
             data: transactions 
            })
        );
 
});

const getMyTransactions = catchAsync(async (req, res) => {
 const brandId = req.user.id;
  const filter = pick(req.query, ['paymentStatus', 'amount',]);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const transactions = await transactionService.getMyTransactions(filter, options, brandId);
    res.status(httpStatus.OK).json(
        response(
            {
             staus: "success",
             messsage: "get Transaction",
             statusCode: httpStatus.OK, 
             data: transactions 
            })
        );
 
});

// Get a transaction by its ID
const getTransactionById =  catchAsync(  async(req, res) => {
  const { id } = req.params; 
    const transaction = await transactionService.getTransactionById(id);
    res.status(200).json( 
        response(
            {
             staus: "success",
             messsage: "get Transaction",
             statusCode: httpStatus.OK, 
             data: transaction
            }));
 
});

// Delete a transaction by its ID
const deleteTransaction = catchAsync(  async(req, res) => {
  const { id } = req.params; 
    const deletedTransaction = await transactionService.deleteTransaction(id);
    res.status(200).json({ message: "Transaction deleted successfully", deletedTransaction });
  
});

module.exports = {
    createTransactionForCampaign, 
    getAllTransactions, 
    getTransactionById, 
    deleteTransaction ,
    getMyTransactions
};



 