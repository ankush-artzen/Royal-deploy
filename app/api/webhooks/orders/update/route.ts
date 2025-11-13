// import { NextRequest, NextResponse } from "next/server";
// import prisma from "@/lib/db/prisma-connect";
// import { createRoyaltyTransactionForOrder } from "@/lib/helper/createRoyaltyTransactionForOrder";
// import { convertCurrency } from "@/lib/config/currency-utils";

// export async function POST(req: NextRequest) {
//   try {
//     console.log("✅ Orders Updated webhook hit", new Date().toISOString());

//     const shop = req.headers.get("x-shopify-shop-domain");
//     if (!shop) {
//       return NextResponse.json(
//         { success: false, message: "Missing shop header" },
//         { status: 400 },
//       );
//     }

//     const body = await req.json();
//     const orderId = body.id?.toString();
//     const orderName = body.name;
//     const currency = body.currency || "USD";
//     const storeCurrency = body.presentment_currency || currency;
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
    const storeCurrency = body.presentment_currency || currency;

    console.log(" Incoming order update:", {
      id: orderId,
      financial_status: body.financial_status,
      fulfillment_status: body.fulfillment_status,
    });

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
