// const mongoose = require("mongoose");
// const { toJSON, paginate } = require("./plugins");

// const planSubscriptionSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     planName: {
//       type: String,
//       required: true,
//     },
//     price: {
//       type: Number,
//       required: true,
//     },
//     duration: {
//       type: String, // 'monthly', 'yearly', etc.
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["pending", "active", "inactive"],
//       default: "pending",
//     },
//     stripeSessionId: {
//       type: String,
//       required: true,
//     },
//     transactionId: {
//       type: String,
//       required: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// planSubscriptionSchema.plugin(toJSON);
// planSubscriptionSchema.plugin(paginate);

// const PlanSubscription = mongoose.model("PlanSubscription", planSubscriptionSchema);
// module.exports = PlanSubscription;



const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const planSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
   currency: {
      type: String,
      required: false,
      default: "", 
      
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String, // 'monthly', 'yearly', etc.
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    expirationDate: {
      type: Date, // This will store the expiration date of the subscription
      required: false, // Optional, based on your use case
    },
  },
  {
    timestamps: true,
  }
);

planSubscriptionSchema.plugin(toJSON);
planSubscriptionSchema.plugin(paginate);

const PlanSubscription = mongoose.model("PlanSubscription", planSubscriptionSchema);
module.exports = PlanSubscription;
