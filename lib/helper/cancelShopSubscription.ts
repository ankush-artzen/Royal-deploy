import prisma from "@/lib/db/prisma-connect";

/**
 * Cleanup shop data when app is uninstalled:
 * - Cancel subscription (DB only)
 * - Disable all royalties
 */
export async function cancelShopSubscription(shop: string) {
  console.log("===== ⛔ Shop Cleanup START =====");
  console.log("➡️ Shop:", shop);

  try {
    // 1. Cancel subscription
    const subscription = await prisma.royaltySubscription.findUnique({
      where: { shop },
    });

    if (subscription) {
      await prisma.royaltySubscription.update({
        where: { shop },
        data: { status: "cancelled" },
      });
      console.log("✅ Subscription status set to cancelled");
    } else {
      console.log("ℹ️ No subscription found for shop");
    }

    // 2. Disable all royalties
    const result = await prisma.productRoyalty.updateMany({
      where: { shop },
      data: {
        inArchive: true,
        status: "archived",
      },
    });

    console.log(`✅ Disabled ${result.count} royalties`);

    console.log("===== ⛔ Shop Cleanup END =====");
    return {
      subscriptionCancelled: !!subscription,
      royaltiesDisabled: result.count,
    };
  } catch (err) {
    console.error("💥 Failed during shop cleanup:", err);
    throw err;
  }
}
