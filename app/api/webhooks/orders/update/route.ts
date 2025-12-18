// import crypto from "node:crypto";
// import { NextRequest, NextResponse } from "next/server";
// import { generatedSignature } from "@/lib/helper/hmacSignature";
// import prisma from "@/lib/db/prisma-connect";
// import { createRoyaltyTransactionForOrder } from "@/lib/helper/createRoyaltyTransactionForOrder";
// import { convertCurrency } from "@/lib/config/currency-utils";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// export async function POST(req: NextRequest) {
//   console.log("Orders webhook hit at", new Date().toISOString());

//   try {
//     const shop = req.headers.get("x-shopify-shop-domain");
//     const hmacHeader = req.headers.get("x-shopify-hmac-sha256")?.trim();
//     const topic = req.headers.get("x-shopify-topic") || "unknown";

//     if (!shop) {
//       console.error(" Missing x-shopify-shop-domain header");
//       return NextResponse.json(
//         { success: false, message: "Missing shop header" },
//         { status: 400 },
//       );
//     }

//     if (!hmacHeader) {
//       console.error(" Missing x-shopify-hmac-sha256 header");
//       return NextResponse.json(
//         { success: false, message: "Missing signature header" },
//         { status: 400 },
//       );
//     }

//     // Get raw body text
//     const rawBodyText = await req.text();
//     const bodyBuffer = Buffer.from(rawBodyText, "utf8");

//     // Compute expected digest (Base64)
//     const expectedBase64 = generatedSignature(bodyBuffer);

//     // Compare digests securely
//     const headerBuf = Buffer.from(hmacHeader, "base64");
//     const expectedBuf = Buffer.from(expectedBase64, "base64");

//     const sameLength = headerBuf.length === expectedBuf.length;
//     const digestsMatch =
//       sameLength && crypto.timingSafeEqual(headerBuf, expectedBuf);

//     if (!digestsMatch) {
//       console.error(" HMAC mismatch — unauthorized webhook");
//       return NextResponse.json(
//         { success: false, message: "Unauthorized webhook" },
//         { status: 401 },
//       );
//     }

//     console.log("HMAC verification successful");

//     // Parse body safely from raw text
//     const body = JSON.parse(rawBodyText);
//     console.log(" Incoming webhook:", topic, "Order ID:", body.id);

//     const orderId = body.id?.toString();
//     const orderName = body.name;
//     const currency = body.currency || "USD";
//     const storeCurrency = body.presentment_currency || currency;
//     const createdAt = new Date(body.created_at);
//     const financialStatus = body.financial_status;
//     const fulfillmentStatus = body.fulfillment_status;

//     console.log(" Incoming order update:", {
//       id: orderId,
//       financial_status: financialStatus,
//       fulfillment_status: fulfillmentStatus,
//     });

//     // Only process paid & fulfilled orders
//     if (financialStatus !== "paid" || fulfillmentStatus !== "fulfilled") {
//       console.log(
//         ` Skipping order ${orderId} → financial_status=${financialStatus}, fulfillment_status=${fulfillmentStatus}`,
//       );
//       return NextResponse.json({
//         success: true,
//         message: `Skipping order ${orderId} until paid + fulfilled`,
//       });
//     }

//     // Check if royalty order already exists
//     const existingRoyaltyOrder = await prisma.royaltyOrder.findUnique({
//       where: { shop_orderId: { shop, orderId } },
//     });

//     if (existingRoyaltyOrder) {
//       console.log(` Royalty order ${orderId} already exists in database`);
//       // Check if transactions already exist
//       const existingTransactions = await prisma.royaltyTransaction.findMany({
//         where: {
//           shop,
//           orderId,
//         },
//       });

//       if (existingTransactions.length > 0) {
//         console.log(` Transactions already exist for order ${orderId}, skipping`);
//         return NextResponse.json({
//           success: true,
//           message: `Royalty order and transactions already exist for ${orderId}`,
//           royaltyOrder: existingRoyaltyOrder,
//         });
//       }
//     }

//     const productIds: string[] = body.line_items
//       ?.map((item: ShopifyLineItem) => item.product_id?.toString())
//       .filter(Boolean) as string[];

//     if (!productIds?.length) {
//       return NextResponse.json({
//         success: true,
//         message: `Order ${orderId} has no valid products`,
//       });
//     }

//     const productIdGids = productIds.map((id) => `gid://shopify/Product/${id}`);

//     const allRoyalties = await prisma.productRoyalty.findMany({
//       where: {
//         shop,
//         inArchive: false,
//         OR: [
//           { shopifyId: { in: productIds } },
//           { shopifyId: { in: productIdGids } },
//         ],
//       },
//     });

//     if (!allRoyalties.length) {
//       return NextResponse.json({
//         success: true,
//         message: `Order ${orderId} has no royalty setup`,
//       });
//     }

//     // Build lookup map by numeric productId
//     const royaltiesMap = new Map<string, typeof allRoyalties>();
//     allRoyalties.forEach((royalty) => {
//       const numericId = royalty.shopifyId.includes("gid://")
//         ? royalty.shopifyId.replace("gid://shopify/Product/", "")
//         : royalty.shopifyId;

//       if (!royaltiesMap.has(numericId)) royaltiesMap.set(numericId, []);
//       royaltiesMap.get(numericId)!.push(royalty);
//     });

//     // Prepare line items for royalty order
//     const lineItemsToAdd: any[] = [];
//     let totalOrderAmount = 0;
//     let totalRoyaltyAmount = 0;

//     for (const item of body.line_items as ShopifyLineItem[]) {
//       const productIdNumeric = item.product_id?.toString();
//       if (!productIdNumeric) continue;

//       const royalties = (royaltiesMap.get(productIdNumeric) || []).filter(
//         (r) => !r.inArchive,
//       );
//       if (!royalties.length) continue;

//       const quantity = Number(item.quantity) || 0;
//       const unitPrice = Number(item.price) || 0;
//       const lineTotal = unitPrice * quantity;
//       totalOrderAmount += lineTotal;

//       for (const royalty of royalties) {
//         // Check expiry date before processing
//         if (royalty.expiry) {
//           const expiryDate = new Date(royalty.expiry);
//           if (expiryDate.getTime() < Date.now()) {
//             console.log(
//               `⚠️ Skipping expired royalty for product ${productIdNumeric} - ${item.title}`,
//             );
//             continue;
//           }
//         }

//         const royaltyAmount = (lineTotal * royalty.royality) / 100;

//         let storeRoyaltyAmount = royaltyAmount;
//         if (currency !== storeCurrency) {
//           storeRoyaltyAmount = await convertCurrency(
//             royaltyAmount,
//             currency,
//             storeCurrency,
//           );
//         }

//         totalRoyaltyAmount += storeRoyaltyAmount;

//         lineItemsToAdd.push({
//           productId: royalty.productId,
//           title: item.title,
//           variantId: item.variant_id?.toString() || "",
//           variantTitle: item.variant_title || "",
//           designerId: royalty.designerId,
//           productRoyaltyAmount: storeRoyaltyAmount,
//           quantity,
//           unitPrice,
//           royaltyPercentage: royalty.royality,
//           expiry: royalty.expiry,
//         });
//       }
//     }

//     if (!lineItemsToAdd.length) {
//       return NextResponse.json({
//         success: true,
//         message: `Order ${orderId} has no valid royalty items (may be expired)`,
//       });
//     }

//     // Convert total order amount to store currency if needed
//     let orderProductTotalAmount = totalOrderAmount;
//     if (currency !== storeCurrency) {
//       orderProductTotalAmount = await convertCurrency(
//         totalOrderAmount,
//         currency,
//         storeCurrency,
//       );
//     }

//     // Convert royalty amount to USD for reference
//     let convertedCurrencyAmountRoyality = totalRoyaltyAmount;
//     if (storeCurrency !== "USD") {
//       convertedCurrencyAmountRoyality = await convertCurrency(
//         totalRoyaltyAmount,
//         storeCurrency,
//         "USD",
//       );
//     }

//     // Create or update royalty order in database
//     let royaltyOrder;
//     if (existingRoyaltyOrder) {
//       // Update existing royalty order
//       royaltyOrder = await prisma.royaltyOrder.update({
//         where: { id: existingRoyaltyOrder.id },
//         data: {
//           lineItem: lineItemsToAdd,
//           calculatedRoyaltyAmount: totalRoyaltyAmount,
//           convertedCurrencyAmountRoyality,
//           orderProductTotalAmount,
//           currency: storeCurrency,
//         },
//       });
//       console.log(` Updated royalty order ${orderId} in database`);
//     } else {
//       // Create new royalty order
//       royaltyOrder = await prisma.royaltyOrder.create({
//         data: {
//           shop,
//           orderId,
//           orderName,
//           lineItem: lineItemsToAdd,
//           calculatedRoyaltyAmount: totalRoyaltyAmount,
//           convertedCurrencyAmountRoyality,
//           orderProductTotalAmount,
//           currency: storeCurrency,
//           createdAt,
//         },
//       });
//       console.log(` Created royalty order ${orderId} in database`);
//     }

//     // Create royalty transactions only if not expired (double-check)
//     const transactionResults = await Promise.allSettled(
//       lineItemsToAdd.map(async (li) => {
//         // Double-check expiry date before creating transaction
//         if (li.expiry) {
//           const expiryDate = new Date(li.expiry);
//           if (expiryDate.getTime() < Date.now()) {
//             console.log(
//               `⚠️ Skipping transaction for ${li.title} → royalty expired`,
//             );
//             return null;
//           }
//         }

//         try {
//           await createRoyaltyTransactionForOrder({
//             shop,
//             orderId,
//             orderName,
//             productId: li.productId,
//             variantId: li.variantId,
//             description: `Royalty payment for order ${orderName} - ${li.title}`,
//             price: li.productRoyaltyAmount,
//             currency: storeCurrency,
//             royaltyPercentage: li.royaltyPercentage,
//             designerId: li.designerId,
//             shopifyTransactionChargeId: "",
//             royaltyOrderId: royaltyOrder.id, // Pass the royalty order ID
//           });
//           console.log(` Created transaction for ${li.title}`);
//         } catch (error: any) {
//           if (
//             error.message?.includes("already exists") ||
//             error.message?.includes("Transaction already exists")
//           ) {
//             console.log(
//               `⚠️ Transaction already exists for ${li.title} → Skipping`,
//             );
//             return null;
//           }
//           console.error(` Error creating transaction for ${li.title}:`, error);
//           throw error;
//         }
//       }),
//     );

//     const failedTransactions = transactionResults.filter(
//       (r): r is PromiseRejectedResult => r.status === "rejected",
//     );

//     if (failedTransactions.length > 0) {
//       console.warn(
//         `⚠️ ${failedTransactions.length} royalty transactions failed for order ${orderId}`,
//       );
//       return NextResponse.json(
//         {
//           success: false,
//           message: `${failedTransactions.length} transactions failed`,
//         },
//         { status: 500 },
//       );
//     }

//     const successfulTransactions = transactionResults.filter(
//       (r) => r.status === "fulfilled" && r.value !== null,
//     ).length;

//     console.log(
//       ` Order ${orderId} processed with ${successfulTransactions} royalty transactions created`,
//     );

//     return NextResponse.json({
//       success: true,
//       royaltyOrder: {
//         id: royaltyOrder.id,
//         orderId,
//         orderName,
//         totalItems: lineItemsToAdd.length,
//         totalRoyaltyAmount: totalRoyaltyAmount,
//         transactionsCreated: successfulTransactions,
//       },
//     });
//   } catch (error: any) {
//     console.error(" Error processing order webhook:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error.message || "Internal Server Error",
//         message: "Failed to process order webhook",
//       },
//       { status: 500 },
//     );
//   }
// }

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { generatedSignature } from "@/lib/helper/hmacSignature";
import prisma from "@/lib/db/prisma-connect";
import { createRoyaltyTransactionForOrder } from "@/lib/helper/createRoyaltyTransactionForOrder";
import { convertCurrency } from "@/lib/config/currency-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  console.log("Orders webhook hit at", new Date().toISOString());

  try {
    const shop = req.headers.get("x-shopify-shop-domain");
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256")?.trim();
    const topic = req.headers.get("x-shopify-topic") || "unknown";

    if (!shop) {
      console.error(" Missing x-shopify-shop-domain header");
      return NextResponse.json(
        { success: false, message: "Missing shop header" },
        { status: 400 },
      );
    }

    if (!hmacHeader) {
      console.error(" Missing x-shopify-hmac-sha256 header");
      return NextResponse.json(
        { success: false, message: "Missing signature header" },
        { status: 400 },
      );
    }

    //  Get raw body text — important for exact HMAC match on Vercel
    const rawBodyText = await req.text();
    const bodyBuffer = Buffer.from(rawBodyText, "utf8");

    //  Compute expected digest (Base64)
    const expectedBase64 = generatedSignature(bodyBuffer);

    // Compare digests securely
    const headerBuf = Buffer.from(hmacHeader, "base64");
    const expectedBuf = Buffer.from(expectedBase64, "base64");

    const sameLength = headerBuf.length === expectedBuf.length;
    const digestsMatch =
      sameLength && crypto.timingSafeEqual(headerBuf, expectedBuf);

    console.log(
      " Shopify HMAC header (base64, trimmed):",
      hmacHeader?.slice(0, 12) + "...",
    );
    console.log(
      " Local digest (base64, trimmed):",
      expectedBase64?.slice(0, 12) + "...",
    );
    console.log(
      " HMAC compare — same length:",
      sameLength,
      "match:",
      digestsMatch,
    );

    if (!digestsMatch) {
      console.error(" HMAC mismatch — unauthorized webhook");
      return NextResponse.json(
        { success: false, message: "Unauthorized webhook" },
        { status: 401 },
      );
    }

    console.log("HMAC verification successful");

    //  Parse body safely from raw text
    const body = JSON.parse(rawBodyText);
    console.log(" Incoming webhook:", topic, "Order ID:", body.id);

    const orderId = body.id?.toString();
    const orderName = body.name;
    const currency = body.currency || "USD";
    const createdAt = new Date(body.created_at);
    const storeCurrency = body.presentment_currency || currency;

    console.log(" Incoming order update:", {
      id: orderId,
      financial_status: body.financial_status,
      fulfillment_status: body.fulfillment_status,
    });

    const existingOrder = await prisma.royaltyOrder.findUnique({
      where: { shop_orderId: { shop, orderId } },
    });

    console.log("existing********ordeer**************", !!existingOrder);

    const productIds: string[] = body.line_items
      ?.map((item: ShopifyLineItem) => item.product_id?.toString())
      .filter(Boolean) as string[];

    if (!productIds?.length) {
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} has no valid products`,
      });
    }

    const productIdGids = productIds.map((id) => `gid://shopify/Product/${id}`);

    if (!existingOrder) {
      const result = await prisma.$transaction(
        async (tx) => {
          // Get royalty config
          const allRoyalties = await tx.productRoyalty.findMany({
            where: {
              shop,
              // inArchive: false,
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
            // const royalties = (royaltiesMap.get(productId) || []).filter(
            //   (r) => !r.inArchive,
            // );
            const royalties = royaltiesMap.get(productId) || [];
            if (!royalties.length) continue;
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
          for (const li of lineItemsToAdd) {
            if (li.designerId && li.royaltyPercentage !== undefined) {
              await tx.notification.create({
                data: {
                  type: "royalty_order",
                  message: `Order created for "${shop}" product Name  "${li.title}" at ${li.royaltyPercentage}% royalty`,
                  shop,
                  designerId: li.designerId,
                },
              });
              console.log(
                `royalty notification created for ${li.title} (Designer: ${li.designerId})`,
              );
            }
          }

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
    } else {
      console.log("existing**********************");
      const existingVariantIds: string[] =
        (existingOrder?.lineItem
          ?.map((item) => item.variantId?.toString())
          .filter(Boolean) as string[]) || [];

      console.log(
        ` Existing variant IDs in order ${orderId}:`,
        existingVariantIds,
      );

      const incomingVariantIds: string[] = body.line_items
        ?.map((item: ShopifyLineItem) => item.variant_id?.toString())
        .filter(Boolean) as string[];

      console.log(` Incoming variant IDs from webhook:`, incomingVariantIds);

      // Find new variant IDs that don't exist in current order
      // const newVariantIds = incomingVariantIds.filter(
      //   (id) => !existingVariantIds.includes(id),
      // );
      const newVariantIds = body.line_items
        .filter((item: ShopifyLineItem) => {
          const variantId = item.variant_id?.toString();
          if (!variantId) return false;

          const existing = existingOrder.lineItem.find(
            (li) => li.variantId?.toString() === variantId,
          );

          if (!existing) return true;

          if (
            Number(item.quantity) !== Number(existing.quantity) ||
            Number(item.price) !== Number(existing.unitPrice)
          ) {
            return true;
          }

          return false;
        })
        .map((item: ShopifyLineItem) => item.variant_id!.toString());

      if (newVariantIds.length) {
        console.log("*****************new", newVariantIds);

        const variants = body.line_items?.filter(
          (item: ShopifyLineItem) =>
            item.variant_id &&
            newVariantIds.includes(item.variant_id.toString()),
        );

        const productIds: string[] = variants.map((item: ShopifyLineItem) =>
          item.product_id?.toString(),
        );

        console.log("*****************new productIds", productIds);

        const allRoyalties = await prisma.productRoyalty.findMany({
          where: {
            shop,
            // inArchive: false,
            OR: [
              { shopifyId: { in: productIds } },
              { shopifyId: { in: productIdGids } },
            ],
          },
        });

        if (allRoyalties.length) {
          console.log("allroyalties**********", allRoyalties);

          const lineItems = [...existingOrder.lineItem];
          let totalOrderAmount = existingOrder?.orderProductTotalAmount || 0;
          let totalRoyaltyAmount = existingOrder.calculatedRoyaltyAmount || 0;

          // for (const royalty of allRoyalties) {
          //   const item = variants.find(
          //     (item: ShopifyLineItem) =>
          //       item.product_id?.toString() === royalty.productId.toString(),
          //   );

          //   const quantity = Number(item.quantity) || 0;
          //   const unitPrice = Number(item.price) || 0;
          //   const lineTotal = unitPrice * quantity;
          //   totalOrderAmount += lineTotal;

          //   const royaltyAmount = (lineTotal * royalty.royality) / 100;

          //   let storeRoyaltyAmount = royaltyAmount;
          //   if (currency !== storeCurrency) {
          //     storeRoyaltyAmount = await convertCurrency(
          //       royaltyAmount,
          //       currency,
          //       storeCurrency,
          //     );
          //   }

          //   totalRoyaltyAmount += storeRoyaltyAmount;

          //   if (item) {
          //     lineItems.push({
          //       productId: royalty.productId,
          //       title: royalty.title,
          //       variantId: item?.variant_id.toString(),
          //       variantTitle: item.variant_title || "",
          //       designerId: royalty.designerId,
          //       productRoyaltyAmount: storeRoyaltyAmount,
          //       quantity: quantity,
          //       unitPrice: unitPrice,
          //       royaltyPercentage: royalty.royality,
          //     });
          //   }
          // }
          for (const royalty of allRoyalties) {
            const matchedVariants = variants.filter(
              (item: ShopifyLineItem) =>
                item.product_id?.toString() === royalty.productId.toString(),
            );
          
            for (const item of matchedVariants) {
              const quantity = Number(item.quantity) || 0;
              const unitPrice = Number(item.price) || 0;
              const lineTotal = unitPrice * quantity;
          
              const royaltyAmount = (lineTotal * royalty.royality) / 100;
          
              let storeRoyaltyAmount = royaltyAmount;
              if (currency !== storeCurrency) {
                storeRoyaltyAmount = await convertCurrency(
                  royaltyAmount,
                  currency,
                  storeCurrency,
                );
              }
          
              totalOrderAmount += lineTotal;
              totalRoyaltyAmount += storeRoyaltyAmount;
          
              lineItems.push({
                productId: royalty.productId,
                title: royalty.title,
                variantId: item.variant_id.toString(),
                variantTitle: item.variant_title || "",
                designerId: royalty.designerId,
                productRoyaltyAmount: storeRoyaltyAmount,
                quantity,
                unitPrice,
                royaltyPercentage: royalty.royality,
              });
            }
          }
          

          let convertedCurrencyAmountRoyality = totalRoyaltyAmount;
          let orderProductTotalAmount = totalOrderAmount;
          if (storeCurrency !== "USD") {
            convertedCurrencyAmountRoyality = await convertCurrency(
              totalRoyaltyAmount,
              storeCurrency,
              "USD",
            );
          }

          console.log("*currency", currency, storeCurrency);

          if (currency !== storeCurrency) {
            // Only convert for new items, or if this is a new order
            orderProductTotalAmount = await convertCurrency(
              totalOrderAmount,
              currency,
              storeCurrency,
            );
          }

          console.log({
            lineItem: lineItems,
            calculatedRoyaltyAmount: totalRoyaltyAmount,
            convertedCurrencyAmountRoyality,
            orderProductTotalAmount,
            currency: storeCurrency,
          });

          await prisma.royaltyOrder.update({
            where: { shop_orderId: { shop, orderId } },
            data: {
              lineItem: lineItems,
              calculatedRoyaltyAmount: totalRoyaltyAmount,
              convertedCurrencyAmountRoyality,
              orderProductTotalAmount,
              currency: storeCurrency,
            },
          });
        }
      }
    }

    // Only process paid & fulfilled orders
    if (
      body.financial_status !== "paid" ||
      body.fulfillment_status !== "fulfilled"
    ) {
      console.log(
        ` Skipping order ${orderId} → financial_status=${body.financial_status}, fulfillment_status=${body.fulfillment_status}`,
      );
      return NextResponse.json({
        success: true,
        message: `Skipping order ${orderId} until paid + fulfilled`,
      });
    }

    const allRoyalties = await prisma.productRoyalty.findMany({
      where: {
        shop,
        inArchive: false,
        OR: [
          { shopifyId: { in: productIds } },
          { shopifyId: { in: productIdGids } },
        ],
      },
    });

    if (!allRoyalties.length) {
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} has no royalty setup`,
      });
    }

    // Build lookup map by numeric productId
    const royaltiesMap = new Map<string, typeof allRoyalties>();
    allRoyalties.forEach((royalty) => {
      const numericId = royalty.shopifyId.includes("gid://")
        ? royalty.shopifyId.replace("gid://shopify/Product/", "")
        : royalty.shopifyId;

      if (!royaltiesMap.has(numericId)) royaltiesMap.set(numericId, []);
      royaltiesMap.get(numericId)!.push(royalty);
    });

    // Prepare line items for royalty transactions and orders
    const lineItemsToAdd: any[] = [];
    for (const item of body.line_items as ShopifyLineItem[]) {
      const productIdNumeric = item.product_id?.toString();
      if (!productIdNumeric) continue;

      const royalties = (royaltiesMap.get(productIdNumeric) || []).filter(
        (r) => !r.inArchive,
      );
      if (!royalties.length) continue;

      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.price) || 0;
      const lineTotal = unitPrice * quantity;

      for (const royalty of royalties) {
        // Check expiry date before processing
        if (royalty.expiry) {
          const expiryDate = new Date(royalty.expiry);
          if (expiryDate.getTime() < Date.now()) {
            console.log(
              `⚠️ Skipping expired royalty for product ${productIdNumeric} - ${item.title}`,
            );
            continue;
          }
        }

        const royaltyAmount = (lineTotal * royalty.royality) / 100;

        let storeRoyaltyAmount = royaltyAmount;
        if (currency !== storeCurrency) {
          storeRoyaltyAmount = await convertCurrency(
            royaltyAmount,
            currency,
            storeCurrency,
          );
        }

        lineItemsToAdd.push({
          productId: royalty.productId,
          title: item.title,
          variantId: item.variant_id?.toString() || "",
          variantTitle: item.variant_title || "",
          designerId: royalty.designerId,
          productRoyaltyAmount: {
            original: royaltyAmount,
            store: storeRoyaltyAmount,
          },
          quantity,
          unitPrice,
          royaltyPercentage: royalty.royality,
          expiry: royalty.expiry,
        });
      }
    }

    if (!lineItemsToAdd.length) {
      return NextResponse.json({
        success: true,
        message: `Order ${orderId} has no valid royalty items (may be expired)`,
      });
    }

    //  Create royalty transactions only if not expired (double-check)
    const transactionResults = await Promise.allSettled(
      lineItemsToAdd.map(async (li) => {
        //  Double-check expiry date before creating transaction
        if (li.expiry) {
          const expiryDate = new Date(li.expiry);
          if (expiryDate.getTime() < Date.now()) {
            console.log(
              `⚠️ Skipping transaction for ${li.title} → royalty expired`,
            );
            return null;
          }
        }

        try {
          await createRoyaltyTransactionForOrder({
            shop,
            orderId,
            orderName,
            productId: li.productId,
            variantId: li.variantId,
            description: `Royalty payment for order ${orderName} - ${li.title}`,
            price: li.productRoyaltyAmount.store,
            currency: storeCurrency,
            royaltyPercentage: li.royaltyPercentage,
            designerId: li.designerId,
            shopifyTransactionChargeId: "",
          });
          console.log(` Created transaction for ${li.title}`);
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
          console.error(` Error creating transaction for ${li.title}:`, error);
          throw error;
        }
      }),
    );

    const failedTransactions = transactionResults.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );

    if (failedTransactions.length > 0) {
      console.warn(
        `⚠️ ${failedTransactions.length} royalty transactions failed for order ${orderId}`,
      );
      return NextResponse.json(
        {
          success: false,
          message: `${failedTransactions.length} transactions failed`,
        },
        { status: 500 },
      );
    }

    const successfulTransactions = transactionResults.filter(
      (r) => r.status === "fulfilled" && r.value !== null,
    ).length;

    console.log(
      ` Order ${orderId} processed with ${successfulTransactions} royalty transactions created`,
    );

    return NextResponse.json({
      success: true,
      royaltyOrder: {
        orderId,
        orderName,
        totalItems: lineItemsToAdd.length,
        transactionsCreated: successfulTransactions,
      },
    });
  } catch (error: any) {
    console.error(" Error processing order webhook:", error);
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
