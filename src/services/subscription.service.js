const PlanSubscription = require("../models/payment.model");




const getAllSubscriptionsService = async (filter, options) => {  
    const query = {}; 

    for (const key of Object.keys(filter)) {
    if (
      (key === "planName" || key === "price" || key === "status") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  // Fetch the paginated and filtered subscriptions
  const subscriptions = await PlanSubscription.paginate(query, options); 
  return subscriptions;
};



module.exports = {
  getAllSubscriptionsService,
};