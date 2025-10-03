import { NextRequest, NextResponse } from "next/server";
import { findSessionsByShop } from "@/lib/db/session-storage";
import prisma from "@/lib/db/prisma-connect";

export const dynamic = "force-dynamic";

const API_VERSION = "2025-07";

export async function GET(req: NextRequest) {
  console.log("===== 🟢 Billing Callback Handler START =====");
  console.log("🔗 Incoming request URL:", req.url);

  try {
    const { searchParams } = new URL(req.url);
    let shop = searchParams.get("shop") || "";
    const chargeId = searchParams.get("charge_id") || "";
    let hostParam = searchParams.get("host") || "";

    // Decode host if needed
    if (!shop && hostParam) {
      try {
        const decodedHost = Buffer.from(hostParam, "base64").toString("utf8");
        shop = decodedHost.replace("/admin", "");
      } catch (err) {
        console.error("⚠️ Failed to decode host:", err);
      }
    }

    console.log("🔎 Extracted:", { shop, chargeId, hostParam });

    // Fetch session token
    const sessions = shop ? await findSessionsByShop(shop) : [];
    const token = sessions?.[0]?.accessToken;

    // Fetch charge from Shopify
    let rac: any = null;
    if (shop && chargeId && token) {
      const chargeUrl = `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}.json`;
      const resp = await fetch(chargeUrl, {
        headers: { "X-Shopify-Access-Token": token },
      });
      const data = await resp.json();
      rac = data?.recurring_application_charge || null;

      // Activate if pending
      if (rac?.status === "pending") {
        const activateUrl = `https://${shop}/admin/api/${API_VERSION}/recurring_application_charges/${chargeId}/activate.json`;
        const activateRes = await fetch(activateUrl, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
          },
        });
        const activateData = await activateRes.json();
        rac = activateData?.recurring_application_charge || rac;
      }

      // Save to DB
      if (rac) {
        await prisma.royaltySubscription.upsert({
          where: { shop },
          update: {
            chargeId: rac.id?.toString(),
            planName: rac.name,
            cappedAmount: rac.capped_amount ? parseFloat(rac.capped_amount) : null,
            currency: rac.currency,
            status: rac.status,
            test: rac.test,
          },
          create: {
            shop,
            chargeId: rac.id?.toString(),
            planName: rac.name,
            cappedAmount: rac.capped_amount ? parseFloat(rac.capped_amount) : null,
            currency: rac.currency,
            status: rac.status,
            test: rac.test,
          },
        });
      }
    }

    // Generate fallback host
    if (!hostParam && shop) {
      hostParam = Buffer.from(`${shop}/admin`, "utf8").toString("base64").replace(/=/g, "");
    }

    // ✅ Create redirect response
    const redirectUrl = shop && hostParam
      ? `https://${shop}/admin/apps/${process.env.SHOPIFY_API_KEY}/royalty/billing?host=${hostParam}`
      : `${process.env.HOST}/app?billing=done`;

    const response = NextResponse.redirect(redirectUrl);

    // ✅ Set billingActive cookie so middleware can read it
    response.cookies.set({
      name: "billingActive",
      value: "true",
      path: "/",             // Must be root to be visible to middleware
      httpOnly: true,        // Only server can read
      sameSite: "lax",       // Shopify iframe-safe
      secure: process.env.NODE_ENV === "production",
    });

    console.log("🚀 Redirecting to:", redirectUrl);
    console.log("✅ billingActive cookie set");
    console.log("===== 🟢 Billing Callback Handler END =====");

    return response;
  } catch (error: any) {
    console.error("❌ Callback error:", error?.message || error);
    console.log("===== 🔴 Billing Callback Handler CRASH =====");
    return NextResponse.redirect(`${process.env.HOST}/app?billing=error`);
  }
}
