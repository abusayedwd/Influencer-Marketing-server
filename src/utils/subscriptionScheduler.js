// subscriptionScheduler.js

const cron = require("node-cron");
const { PlanSubscription, User } = require("./models");

cron.schedule("* * * * *", async () => {
  const currentDate = new Date();

  // Find expired subscriptions
  const expiredSubscriptions = await PlanSubscription.find({
    expirationDate: { $lt: currentDate },
    status: "active",
  });

  for (const subscription of expiredSubscriptions) {
    // Update subscription to inactive
    subscription.status = "inactive";
    await subscription.save();

    // Find the corresponding user and update the subscription status
    const user = await User.findById(subscription.userId);
    if (user) {
      user.isSubscribe = false;
      user.subscriptionId = null; // Remove the subscription reference
      await user.save();
      console.log(`User ${user.email} subscription expired and updated.`);
    }
  }
});
