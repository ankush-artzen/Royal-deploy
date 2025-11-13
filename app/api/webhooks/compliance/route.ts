import crypto from "crypto";
import { NextResponse } from "next/server";

const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET as string;

if (!SHOPIFY_WEBHOOK_SECRET) {
  throw new Error(
    "❌ SHOPIFY_WEBHOOK_SECRET is not defined in environment variables",
  );
}

// 🧩 Type Definitions for Shopify GDPR Webhooks
interface ShopifyCustomer {
  id: number;
  email?: string;
  phone?: string;
}

interface DataRequestPayload {
  shop_id: number;
  shop_domain: string;
  orders_requested?: number[];
  customer?: ShopifyCustomer;
  data_request?: { id: number };
}

interface RedactCustomerPayload {
  shop_id: number;
  shop_domain: string;
  customer?: ShopifyCustomer;
  orders_to_redact?: number[];
}

interface RedactShopPayload {
  shop_id: number;
  shop_domain: string;
}

// ✅ Route Handler
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic");
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    if (!hmacHeader) {
      console.error("❌ Missing HMAC header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔐 Verify HMAC signature
    const generatedHash = crypto
      .createHmac("sha256", SHOPIFY_WEBHOOK_SECRET)
      .update(rawBody, "utf8")
      .digest("base64");

    if (generatedHash !== hmacHeader) {
      console.error("❌ Invalid HMAC signature for shop:", shopDomain);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    console.log(`✅ Compliance webhook received from ${shopDomain}`);
    console.log(`📬 Topic: ${topic}`);
    console.log(`📦 Payload:`, payload);

    switch (topic) {
      case "customers/data_request":
        await handleDataRequest(payload as DataRequestPayload);
        break;

      case "customers/redact":
        await handleCustomerRedact(payload as RedactCustomerPayload);
        break;

      case "shop/redact":
        await handleShopRedact(payload as RedactShopPayload);
        break;

      default:
        console.warn("⚠️ Unknown webhook topic:", topic);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("⚠️ Error processing compliance webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

async function handleDataRequest(payload: DataRequestPayload) {
  const email = payload.customer?.email;
  console.log("📦 Data request received for:", email);

  // 👉 TODO: Implement your logic to retrieve customer data
  // Example:
  // const data = await prisma.customer.findUnique({ where: { email } });
  // emailShopOwner(data);
}

async function handleCustomerRedact(payload: RedactCustomerPayload) {
  const email = payload.customer?.email;
  console.log("🧹 Redact (delete/anonymize) customer:", email);

  // 👉 TODO: Delete or anonymize data
  // Example:
  // await prisma.customer.deleteMany({ where: { email } });
  // await prisma.order.deleteMany({ where: { customerEmail: email } });
}

async function handleShopRedact(payload: RedactShopPayload) {
  const shopDomain = payload.shop_domain;
  console.log("🏪 Redact shop data for:", shopDomain);

  // 👉 TODO: Delete all data for this shop
  // Example:
  // await prisma.shop.deleteMany({ where: { domain: shopDomain } });
  // await prisma.session.deleteMany({ where: { shopDomain } });
}
