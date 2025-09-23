import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { createRoyaltyTransactionForOrder } from "@/lib/helper/createRoyaltyTransactionForOrder";
import { convertCurrency } from "@/lib/config/currency-utils";

export async function POST(req: NextRequest) {
  try {
    console.log("✅ Orders webhook hit at", new Date().toISOString());

    const shop = req.headers.get("x-shopify-shop-domain");
    if (!shop) {
      console.warn("⚠️ Missing shop header in request");
      return NextResponse.json(
        { success: false, message: "Missing shop header" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const orderId = body.id?.toString();
    const orderName = body.name;
    const createdAt = new Date(body.created_at);
    const currency = body.currency || "USD";
    const storeCurrency = body.presentment_currency || currency;

    if (!orderId || !body.line_items) {
      console.warn("⚠️ Invalid order data:", body);
      return NextResponse.json(
        { success: false, message: "Invalid order data" },
        { status: 400 },
      );
    }

    // Prevent double-processing
    const existingOrder = await prisma.royaltyOrder.findUnique({
      where: { shop_orderId: { shop, orderId } },
    });
    if (existingOrder) {
      console.log(`⚠️ Order ${orderId} already processed → Skipping`);
      return NextResponse.json({
        success: true,
        message: "Order already processed",
        royaltyOrder: existingOrder,
      });
    }

    const productIds = body.line_items
      .map((li: any) => li.product_id?.toString())
      .filter(Boolean);

    if (productIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No royalty products in order",
      });
    }

    const productIdGids = productIds.map(
      (id: string) => `gid://shopify/Product/${id}`,
    );

    const result = await prisma.$transaction(
      async (tx) => {
        // Get royalty config
        const allRoyalties = await tx.productRoyalty.findMany({
          where: {
            shop,
            inArchive: false,
            OR: [
              { shopifyId: { in: productIds } },
              { shopifyId: { in: productIdGids } },
            ],
          },
        });

        const royaltiesMap = new Map<string, typeof allRoyalties>();
        allRoyalties.forEach((royalty) => {
          const numericId = royalty.shopifyId.includes("gid://")
            ? royalty.shopifyId.replace("gid://shopify/Product/", "")
            : royalty.shopifyId;

          if (!royaltiesMap.has(numericId)) royaltiesMap.set(numericId, []);
          royaltiesMap.get(numericId)!.push(royalty);
        });

        const lineItemsToAdd: any[] = [];
        const royaltyUpdates: Array<{
          id: string;
          quantity: number;
          amount: number;
        }> = [];

        // Process line items
        for (const item of body.line_items) {
          const productId = item.product_id?.toString();

          if (!productId) continue;

          // const royalties = royaltiesMap.get(productId) || [];
          // if (!royalties.length) continue;
          const royalties = (royaltiesMap.get(productId) || []).filter(
            (r) => !r.inArchive,
          );
          if (!royalties.length) continue;

          const quantity = item.quantity;
          const unitPrice = parseFloat(item.price);
          const lineTotal = unitPrice * quantity;

          for (const royalty of royalties) {
            // Calculate royalty in original currency
            const royaltyAmount = (lineTotal * royalty.royality) / 100;

            // Convert to store currency if different
            let storeRoyaltyAmount = royaltyAmount;
            if (currency !== storeCurrency) {
              storeRoyaltyAmount = await convertCurrency(
                royaltyAmount,
                currency,
                storeCurrency,
              );
            }

            // Convert unit price to store currency if different
            let storeUnitPrice = unitPrice;
            if (currency !== storeCurrency) {
              storeUnitPrice = await convertCurrency(
                unitPrice,
                currency,
                storeCurrency,
              );
            }

            lineItemsToAdd.push({
              productId: royalty.productId,
              title: item.title,
              variantId: item.variant_id?.toString() || "",
              variantTitle: item.variant_title || null,
              designerId: royalty.designerId,
              productRoyaltyAmount: storeRoyaltyAmount,
              quantity,
              unitPrice: storeUnitPrice,
              royaltyPercentage: royalty.royality,
            });

            royaltyUpdates.push({
              id: royalty.id,
              quantity,
              amount: storeRoyaltyAmount,
            });
          }
        }

        if (lineItemsToAdd.length === 0) return null;

        // Update product royalties
        await Promise.all(
          royaltyUpdates.map(async (update) => {
            const productRoyalty = await tx.productRoyalty.findUnique({
              where: { id: update.id },
            });

            // Force TypeScript to treat totalRoyaltyEarned as object
            const prev = (productRoyalty?.totalRoyaltyEarned as {
              amount: number;
              currency: string;
              usdAmount: number;
            }) || { amount: 0, currency: storeCurrency, usdAmount: 0 };

            // Convert current royalty to USD
            // const usdAmount = await convertCurrency(
            //   update.amount,
            //   storeCurrency,
            //   "USD",
            // );
            const usdAmount =
              storeCurrency === "USD"
                ? update.amount
                : await convertCurrency(update.amount, storeCurrency, "USD");

            const newTotal = {
              amount: prev.amount + update.amount,
              currency: storeCurrency,
              usdAmount: prev.usdAmount + usdAmount,
            };

            return tx.productRoyalty.update({
              where: { id: update.id },
              data: {
                totalSold: { increment: update.quantity },
                totalRoyaltyEarned: newTotal,
              },
            });
          }),
        );

        const calculatedRoyaltyAmount = lineItemsToAdd.reduce(
          (sum, li) => sum + li.productRoyaltyAmount,
          0,
        );

        // Convert royalty amount to USD
        let convertedcurrencyamountroyality = calculatedRoyaltyAmount;
        if (storeCurrency !== "USD") {
          convertedcurrencyamountroyality = await convertCurrency(
            calculatedRoyaltyAmount,
            storeCurrency,
            "USD",
          );
        }

        // Calculate total order amount
        const totalOrderAmount = body.line_items.reduce(
          (sum: number, li: any) => sum + parseFloat(li.price) * li.quantity,
          0,
        );

        // Convert order total to store currency
        let orderProductTotalAmount = totalOrderAmount;
        if (currency !== storeCurrency) {
          orderProductTotalAmount = await convertCurrency(
            totalOrderAmount,
            currency,
            storeCurrency,
          );
        }

        return tx.royaltyOrder.create({
          data: {
            shop,
            orderId,
            orderName,
            currency,
            lineItem: lineItemsToAdd,
            calculatedRoyaltyAmount,
            convertedCurrencyAmountRoyality: convertedcurrencyamountroyality,
            orderProductTotalAmount,
            createdAt,
          },
        });
      },
      { timeout: 20000, maxWait: 20000 },
    );

    if (!result) {
      return NextResponse.json({
        success: false,
        message: "No royalty items in order",
      });
    }

    // Only create transactions when order is paid & fulfilled
    if (
      body.fulfillment_status === "fulfilled" &&
      body.financial_status === "paid"
    ) {
      const transactionPromises = result.lineItem.map(async (li: any) => {
        try {
          await createRoyaltyTransactionForOrder({
            shop,
            orderId,
            orderName: result.orderName,

            productId: li.productId,
            description: `Royalty payment for order ${result.orderName} - ${li.title}`,
            price: li.productRoyaltyAmount,
            currency: result.currency || "",
            royaltyPercentage: li.royaltyPercentage,
            designerId: li.designerId,
          });
        } catch (error: any) {
          if (
            error.message?.includes("already exists") ||
            error.message?.includes("Transaction already exists")
          ) {
            console.log(
              `⚠️ Transaction already exists for ${li.title} → Skipping`,
            );
            return null;
          }
          console.error(
            `❌ Error creating transaction for ${li.title}:`,
            error,
          );
          throw error;
        }
      });

      const transactionResults = await Promise.allSettled(transactionPromises);
      const failed = transactionResults.filter((r) => r.status === "rejected");

      if (failed.length > 0) {
        console.warn(`⚠️ ${failed.length} transactions failed`);
        return NextResponse.json(
          { success: false, message: `${failed.length} transactions failed` },
          { status: 500 },
        );
      } else {
        console.log("✅ All royalty transactions created successfully");
      }
    } else {
      console.log(
        `⏸️ Order ${orderId} not fulfilled/paid yet → Transactions pending`,
      );
    }

    return NextResponse.json({ success: true, royaltyOrder: result });
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal Server Error",
        message: "Failed to process order webhook",
      },
      { status: 500 },
    );
  }
}
