const PlanSubscription = require("../models/payment.model");




const getAllSubscriptionsService = async (filter, options) => {  
    const query = { ...filter }; 
  // Fetch the paginated and filtered subscriptions
  const subscriptions = await PlanSubscription.paginate(query, options); 
  return subscriptions;
};



module.exports = {
  getAllSubscriptionsService,
};