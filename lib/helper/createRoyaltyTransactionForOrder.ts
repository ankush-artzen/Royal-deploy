import prisma from "@/lib/db/prisma-connect";
import { findSessionsByShop } from "@/lib/db/session-storage";
import { convertCurrency } from "@/lib/config/currency-utils";

export const dynamic = "force-dynamic";

const API_VERSION = "2025-07";

async function getActiveRoyaltySubscriptionByShop(shop: string) {
  const normalizedShop = shop.toLowerCase();
  const record = await prisma.royaltySubscription.findFirst({
    where: { shop: normalizedShop, status: "active" },
  });
  if (!record)
    throw new Error(`No active royalty subscription found for shop: ${shop}`);
  return record;
}

export async function createRoyaltyTransactionForOrder({
  shop,
  orderId,
  orderName,
  productId,
  description,
  price, // raw amount (INR, etc.)
  currency,
  royaltyPercentage,
  shopifyTransactionChargeId,
  designerId,
}: CreateRoyaltyTxParams) {
  // 1️⃣ Skip if price invalid
  if (typeof price !== "number" || isNaN(price) || price <= 0) {
    console.warn(
      `⚠️ Skipping royalty transaction for product ${productId}, invalid price: ${price}`,
    );
    return null;
  }
  console.log("price-------------------------", price);

  // 2️⃣ Convert to USD for Shopify usage charge
  let priceInUSD = await convertCurrency(price, currency, "USD");
  priceInUSD = Number(priceInUSD.toFixed(2)); // round properly
  if (isNaN(priceInUSD) || priceInUSD <= 0) {
    console.warn(
      `⚠️ Skipping royalty transaction for product ${productId}, conversion failed: ${price} ${currency}`,
    );
    return null;
  }
  console.log(`💵 Final charge amount for Shopify: ${priceInUSD} USD`);

  // 3️⃣ Check if transaction already exists
  const existingTx = await prisma.royaltyTransaction.findUnique({
    where: {
      shop_orderId_productId_shopifyTransactionChargeId_designerId: {
        shop,
        orderId,
        productId,
        shopifyTransactionChargeId: shopifyTransactionChargeId || "",
        designerId,
      },
    },
  });
  if (existingTx) return existingTx;

  // 4️⃣ Create Shopify usage charge with USD amount
  const subscriptionRecord = await getActiveRoyaltySubscriptionByShop(shop);
  const chargeId = subscriptionRecord.chargeId!;
  const sessions = (await findSessionsByShop(shop)) as
    | SessionType[]
    | SessionType
    | null;
  const token = Array.isArray(sessions)
    ? sessions[0]?.accessToken
    : sessions?.accessToken;

  if (!token) {
    console.error(`❌ No access token found for shop: ${shop}`);
    throw new Error(`No access token found for shop: ${shop}`);
  }

  console.log(
    `🔑 Using chargeId=${chargeId}, posting usage_charge with price=${priceInUSD} USD`,
  );

  let usageChargeData;
  try {
    const resp = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}/usage_charges.json`,
      {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usage_charge: {
            description,
            price: priceInUSD, // must be the converted USD
          },
        }),
      },
    );

    console.log("📡 Shopify usage charge response status:", resp.status);

    const data = await resp.json();

    // 🔍 Print full response for debugging
    console.log(
      "📦 Full Shopify usage charge response:",
      JSON.stringify(data, null, 2),
    );

    if (!resp.ok || !data.usage_charge) {
      console.error("❌ Shopify usage charge failed:", data);
      throw new Error(`Shopify usage charge failed: ${JSON.stringify(data)}`);
    }

    usageChargeData = data.usage_charge;
    console.log(
      `✅ Shopify usage charge created [id=${usageChargeData.id}, price=${usageChargeData.price} USD]`,
    );
  } catch (err) {
    console.error("❌ Error creating Shopify usage charge:", err);
    throw err;
  }

  // 5️⃣ Save transaction in DB with race-condition protection
  let royaltyTransaction;
  try {
    royaltyTransaction = await prisma.royaltyTransaction.create({
      data: {
        shop,
        shopifyTransactionChargeId: usageChargeData.id.toString(),
        orderId,
        productId,
        orderName,
        description: usageChargeData.description,
        price: {
          storeprice: price,
          storeCurrency: currency,
          usd: parseFloat(usageChargeData.price),
        },
        currency: "USD",
        status: usageChargeData.status || "success",
        balanceUsed: parseFloat(usageChargeData.balance_used ?? "0"),
        balanceRemaining: parseFloat(usageChargeData.balance_remaining ?? "0"),
        royaltyPercentage,
        designerId: designerId || null,
        createdAt: new Date(usageChargeData.created_at),
      },
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      // Prisma unique constraint violation → transaction already exists
      console.warn(
        `⚠️ Duplicate royalty transaction prevented for orderId=${orderId}, productId=${productId}, designerId=${designerId}`,
      );
      royaltyTransaction = await prisma.royaltyTransaction.findUnique({
        where: {
          shop_orderId_productId_shopifyTransactionChargeId_designerId: {
            shop,
            orderId,
            productId,
            shopifyTransactionChargeId: shopifyTransactionChargeId || "",
            designerId,
          },
        },
      });
    } else {
      throw err;
    }
  }

  console.log(
    `✅ RoyaltyTransaction created [txId=${royaltyTransaction?.id}, orderId=${orderId}, price=${royaltyTransaction?.price} USD]`,
  );
  // 6️⃣ Create notification after transaction
  if (royaltyTransaction?.designerId) {
    await prisma.notification.create({
      data: {
        type: "royalty_order",
        message: `Royalty transaction created for "${royaltyTransaction.orderName}" - ${royaltyTransaction.royaltyPercentage}%`,
        shop,
        designerId: royaltyTransaction.designerId,
      },
    });
    console.log(
      `✅ Royalty notification created for ${royaltyTransaction.orderName} (Designer: ${royaltyTransaction.designerId})`,
    );
  }

  // ───── add this block (minimal, non-intrusive) ─────
  try {
    if (royaltyTransaction && royaltyTransaction.designerId) {
      const { designerId: txDesignerId } = royaltyTransaction;
  
      const productRoyalty = await prisma.productRoyalty.findUnique({
        where: {
          productId_designerId: {
            productId,
            designerId: txDesignerId,
          },
        },
      });
  
      if (productRoyalty) {
        // 1️⃣ Read existing totals safely
        let currentAmount = 0;
        let currentUsd = 0;
        let currencyType = currency || "USD";
        let aggregatedOrders: string[] = [];
  
        if (
          productRoyalty.totalRoyaltyEarned &&
          typeof productRoyalty.totalRoyaltyEarned === "object"
        ) {
          const earned = productRoyalty.totalRoyaltyEarned as any;
          currentAmount = earned.amount ?? 0;
          currentUsd = earned.usdAmount ?? 0;
          currencyType = earned.currency ?? currencyType;
          aggregatedOrders = Array.isArray(earned._aggregatedOrders)
            ? earned._aggregatedOrders
            : [];
        }
  
        // 2️⃣ Skip if this order already processed
        if (aggregatedOrders.includes(orderId)) {
          console.log(`⚠️ Order ${orderId} already aggregated for ${productId}, skipping.`);
          return;
        }
  
        // 3️⃣ Find all transactions for same product/designer/order
        const variantTransactions = await prisma.royaltyTransaction.findMany({
          where: {
            shop,
            orderId,
            productId,
            designerId: txDesignerId,
          },
        });
  
        // 4️⃣ Sum up variant prices
        const totalStoreAmount = variantTransactions.reduce((sum, tx) => {
          const storePrice =
            typeof tx.price === "object"
              ? Number((tx.price as any).storeprice || 0)
              : 0;
          return sum + storePrice;
        }, 0);
  
        // 5️⃣ Convert to USD
        const usdAdditionRaw = await convertCurrency(totalStoreAmount, currencyType, "USD");
        const usdAddition = Number(usdAdditionRaw) || 0;
  
        // 6️⃣ Update totals
        const newAmount = currentAmount + totalStoreAmount;
        const newUsdAmount = currentUsd + usdAddition;
  
        aggregatedOrders.push(orderId); // mark this order processed
  
        await prisma.productRoyalty.update({
          where: {
            productId_designerId: {
              productId,
              designerId: txDesignerId,
            },
          },
          data: {
            totalRoyaltyEarned: {
              amount: newAmount,
              currency: currencyType,
              usdAmount: newUsdAmount,
              _aggregatedOrders: aggregatedOrders,
            },
          } as any, // 👈 allow JSON merge
        });
  
        console.log(
          `💰 totalRoyaltyEarned updated for product ${productId} (designer ${txDesignerId}): +${totalStoreAmount} ${currencyType} → ${newAmount} ${currencyType} / ${newUsdAmount} USD (includes all variants from order ${orderId})`,
        );
      } else {
        console.warn(`⚠️ No productRoyalty found for productId=${productId} designer=${txDesignerId}`);
      }
    }
  } catch (err) {
    console.error("❌ Failed to update totalRoyaltyEarned (non-blocking):", err);
  }
  



  return royaltyTransaction;
}
