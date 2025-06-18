const mongoose = require("mongoose");

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
  },
  {
    timestamps: true,
  }
);

const PlanSubscription = mongoose.model("PlanSubscription", planSubscriptionSchema);
module.exports = PlanSubscription;
