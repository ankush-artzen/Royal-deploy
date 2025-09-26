import { NextRequest, NextResponse } from "next/server";
import { findSessionsByShop } from "@/lib/db/session-storage";
import prisma from "@/lib/db/prisma-connect";
import { ROYALTY_CONFIG } from "@/lib/config/royaltyConfig";

const API_VERSION = "2025-07";

export async function PUT(req: NextRequest) {
  console.log("===== 🟢 Recurring Charge Update Handler START =====");

  let body: any = {};
  let recurringCharge: any = null;

  try {
    body = await req.json();
    console.log("📦 Parsed request body:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("❌ Failed to parse JSON body:", error);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { chargeId, cappedAmount, shop: bodyShop } = body;
    const url = new URL(req.url);
    const queryShop = url.searchParams.get("shop");

    // Validate inputs
    const shop = bodyShop || queryShop;
    if (
      !shop ||
      !chargeId ||
      cappedAmount === undefined ||
      cappedAmount === null
    ) {
      return NextResponse.json(
        { error: "shop, chargeId, and cappedAmount are required" },
        { status: 400 },
      );
    }

    // Get access token
    const dbSessions = await findSessionsByShop(shop);
    const token = dbSessions?.[0]?.accessToken;
    if (!token) {
      return NextResponse.json(
        { error: "No access token available for shop" },
        { status: 401 },
      );
    }

    // 🔹 Fetch the latest RoyaltyTransaction BEFORE Shopify API call
    let latestTransaction = null;
    let latestBalanceUsed = 0;

    try {
      latestTransaction = await prisma.royaltyTransaction.findFirst({
        where: { shop },
        orderBy: { createdAt: "desc" },
      });

      if (latestTransaction) {
        latestBalanceUsed = latestTransaction.balanceUsed || 0;
        console.log("📊 Latest balanceUsed:", latestBalanceUsed);
      }
    } catch (txErr) {
      console.error("💥 Failed to fetch latest RoyaltyTransaction:", txErr);
    }
    console.log("latestBalanceUsed", latestBalanceUsed);
    // Shopify REST API call (unchanged)
    const shopifyUrl = `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}/customize.json`;

    const response = await fetch(shopifyUrl, {
      method: "PUT",
      headers: {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recurring_application_charge: {
          // You can optionally use latestBalanceUsed if needed here
          capped_amount:
            ROYALTY_CONFIG.DEFAULT_CAPPED_AMOUNT + latestBalanceUsed,
        },
      }),
    });

    const data = await response.json();
    recurringCharge = data.recurring_application_charge;

    if (!response.ok || !recurringCharge) {
      console.error("❌ Shopify API error or no charge returned:", data);
      return NextResponse.json(
        { error: "Shopify API error", details: data },
        { status: response.status || 502 },
      );
    }

    // Update DB if subscription exists
    try {
      const existingSubscription = await prisma.royaltySubscription.findFirst({
        where: {
          OR: [
            { chargeId: chargeId.toString() },
            { chargeId: `gid://shopify/AppSubscription/${chargeId}` },
          ],
        },
      });

      if (existingSubscription) {
        await prisma.royaltySubscription.update({
          where: { id: existingSubscription.id },
          data: {
            cappedAmount: parseFloat(cappedAmount),
            updatedAt: new Date(),
          },
        });
      }
    } catch (dbErr) {
      console.error("💥 Failed to update charge in DB:", dbErr);
      // Ignore DB errors
    }

    console.log("✅ Returning Shopify update capped amount URL");
    return NextResponse.json({
      success: true,
      updateUrl: recurringCharge.update_capped_amount_url,
      charge: recurringCharge,
    });
  } catch (e: any) {
    console.error("💥 Unexpected error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 },
    );
  }
}