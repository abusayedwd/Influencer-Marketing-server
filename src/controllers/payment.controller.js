// ===== PAYMENT CONTROLLER (payment.controller.js) =====
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const { User } = require("../models/user.model");
const PlanSubscription = require("../models/payment.model");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const catchAsync = require("../utils/catchAsync");

const createPlanPayment = catchAsync(async (req, res) => {
  const { userId, planName, price, duration } = req.body;

  // Validate required fields
  if (!userId || !planName || !price || !duration) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  console.log(endpointSecret, "endpointSecret"); 
  
  // Set the items for the selected plan
  const items = [
    {
      name: planName,
      quantity: 1,
    },
  ];

  // Convert price to cents
  const amount = Math.round(price * 100); // Stripe expects price in cents

  // Create the Stripe Checkout session for the selected plan
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
        },
        unit_amount: amount,
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    // IMPORTANT: Use your actual domain, not localhost IP for production
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
    customer_email: req.user.email,
    metadata: {
      userId: userId.toString(), // Ensure it's a string
      planName,
      planPrice: amount.toString(), // Ensure it's a string
      duration: duration.toString(),
      // Add a unique identifier for this project to distinguish from other projects
      project: "your-project-name" // Replace with your actual project name
    },
  });

  // Create the new plan subscription record
  const newPlanSubscription = await PlanSubscription.create({
    userId,
    planName,
    price,
    duration,
    status: "pending",
    stripeSessionId: session.id,
    transactionId: session.payment_intent,
  });

  // Send response with session URL
  res.status(200).json({
    status: 200,
    message: "Plan payment session created successfully.",
    sessionId: session.id,
    url: session.url, // Frontend will use this URL to redirect to Stripe
    planSubscription: newPlanSubscription,
  });
});

const stripeWebhook = async (req, res) => {
  console.log("Webhook endpoint hit!"); // Add this to verify webhook is being called
  
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify webhook signature
    if (!endpointSecret) {
      console.error("Stripe webhook secret not configured.");
      return res.status(400).json({ error: "Webhook secret not configured" });
    }

    console.log("Raw body type:", typeof req.body);
    console.log("Raw body length:", req.body?.length);
    console.log("Is Buffer:", Buffer.isBuffer(req.body));

    // Construct the event from the request body and signature
    // req.body should now be a Buffer thanks to express.raw()
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("Webhook verified successfully!", event.type);

  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);
    return res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }

  try {
    const data = event.data.object;
    const eventType = event.type;
    console.log(`Processing event type: ${eventType}`);

    // Handle checkout.session.completed event
    if (eventType === "checkout.session.completed") {
      const session = data; // Get session details

      console.log("Payment successfully completed. Session details:", {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata
      });

      // Check if this event is for your project (if you have multiple projects using same Stripe account)
      if (session.metadata && session.metadata.project !== "your-project-name") {
        console.log("Event not for this project, ignoring...");
        return res.status(200).json({ received: true, ignored: true });
      }

      // Extract metadata (like user ID and plan name) from the session
      const { userId, planName, duration } = session.metadata;

      if (!userId || !planName) {
        console.error("Missing required metadata in session:", session.metadata);
        return res.status(400).json({ error: "Missing metadata" });
      }

      // Validate that userId is a valid ObjectId (if using MongoDB)
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error("Invalid userId in metadata:", userId);
        return res.status(400).json({ error: "Invalid userId" });
      }

      // Find and update the plan subscription record
      const updatedSubscription = await PlanSubscription.findOneAndUpdate(
        { stripeSessionId: session.id }, // Find the plan subscription by the session ID
        {
          status: "active", // Mark the subscription as active
          transactionId: session.payment_intent, // Store the payment intent ID
          updatedAt: new Date()
        },
        { new: true } // Return the updated record
      );

      if (!updatedSubscription) {
        console.error(`Subscription not found for session: ${session.id}`);
        // Don't return error here, just log it - the payment was successful
        // return res.status(404).json({ error: "Subscription not found" });
      } else {
        console.log("Subscription activated:", updatedSubscription);
      }

      // Find and update the user document
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          isSubscribe: true, // Mark the user as subscribed
          planName, // Set the plan name from the session
          subscriptionDate: new Date(),
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedUser) {
        console.error("User not found for ID:", userId);
        // Don't return error here, just log it - the payment was successful
        // return res.status(404).json({ error: "User not found" });
      } else {
        console.log("User subscription status updated:", {
          id: updatedUser._id,
          email: updatedUser.email,
          isSubscribe: updatedUser.isSubscribe,
          planName: updatedUser.planName
        });
      }
    }

    // Handle other event types if needed
    else if (eventType === "payment_intent.payment_failed") {
      console.log("Payment failed:", data.id);
      // Handle failed payment
      
      // Check if this event is for your project
      if (data.metadata && data.metadata.project !== "your-project-name") {
        console.log("Event not for this project, ignoring...");
        return res.status(200).json({ received: true, ignored: true });
      }
      
      // Handle failed payment logic here
    }

    // Respond to acknowledge receipt of the event
    res.status(200).json({ received: true, eventType });

  } catch (error) {
    console.error("Error processing webhook event:", error);
    // Always respond with 200 to prevent Stripe from retrying
    res.status(200).json({ error: "Internal server error", received: true });
  }
};

module.exports = {
  createPlanPayment,
  stripeWebhook 
};