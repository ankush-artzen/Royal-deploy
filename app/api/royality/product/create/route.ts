import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { convertCurrency } from "@/lib/config/currency-utils";
import { findSessionsByShop } from "@/lib/db/session-storage";

const API_VERSION = "2025-07";
async function getShopCurrency(shop: string) {
  console.log("🔎 Fetching currency for shop:", shop);

  const sessions = await findSessionsByShop(shop);
  console.log("📦 Sessions fetched:", sessions);

  const session = Array.isArray(sessions) ? sessions[0] : sessions;
  if (!session?.accessToken) {
    throw new Error("Missing session for shop: " + shop);
  }

  const resp = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/shop.json`,
    {
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
        "Content-Type": "application/json",
      },
    },
  );

  console.log("🌐 Shopify API response status:", resp.status);

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("❌ Failed to fetch shop info:", errText);
    throw new Error(`Failed to fetch shop info: ${resp.statusText}`);
  }

  const data = await resp.json();
  console.log("📦 Shopify shop data:", data);

  return data.shop.currency as string;
}

export async function POST(req: NextRequest) {
  try {
    console.log("📩 Incoming request URL:", req.url);

    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    console.log("🔍 Shop from query:", shop);

    const body = await req.json();
    console.log("📦 Request body:", body);

    const {
      designerId,
      productId,
      royality,
      title,
      image,
      status = "active",
      inArchive = "false",
      price = 0,
      shopifyId,
      expiry,
    } = body;

    // ✅ Validation
    // if (
    //   !shop ||
    //   !productId ||
    //   !royality ||
    //   isNaN(royality) ||
    //   !title ||
    //   !designerId ||
    //   expiry
    // ) {
    //   console.warn("⚠️ Validation failed:", {
    //     shop,
    //     productId,
    //     royality,
    //     title,
    //     designerId,
    //     expiry,
    //   });
    //   return NextResponse.json(
    //     {
    //       error:
    //         "Missing or invalid shop, productId, title, Royality, designerId, or expiry",
    //     },
    //     { status: 400 },
    //   );
    // }
    if (
      !shop ||
      !productId ||
      !royality ||
      isNaN(royality) ||
      !title ||
      !designerId
    ) {
      console.warn("⚠️ Validation failed:", {
        shop,
        productId,
        royality,
        title,
        designerId,
        expiry,
      });
      return NextResponse.json(
        {
          error:
            "Missing or invalid shop, productId, title, Royality, designerId",
        },
        { status: 400 },
      );
    }

    // ✅ Designer ID format check
    const designerIdPattern = /^RA\d{9}$/;
    if (!designerIdPattern.test(designerId)) {
      return NextResponse.json(
        {
          error: `Invalid Designer ID format: ${designerId}. Expected format: RA#########`,
        },
        { status: 400 },
      );
    }

    // ✅ Expiry date
    let expiryDate: Date | null = null;
    if (expiry && expiry.trim() !== "") {
      expiryDate = new Date(expiry);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date format" },
          { status: 400 },
        );
      }
    }

    // ✅ Product already assigned check
    const productAlreadyAssigned = await prisma.productRoyalty.findFirst({
      where: { productId },
    });
    console.log("🔎 Product already assigned?", productAlreadyAssigned);

    if (productAlreadyAssigned) {
      return NextResponse.json(
        {
          error: `This product is already assigned to designer ${productAlreadyAssigned.designerId}`,
        },
        { status: 400 },
      );
    }

    // ✅ Existing royalty check
    const existingRoyalty = await prisma.productRoyalty.findFirst({
      where: { productId, designerId },
    });
    console.log(
      "🔎 Existing royalty for this designer/product?",
      existingRoyalty,
    );

    if (existingRoyalty) {
      return NextResponse.json(
        { error: "Royalty already assigned for this product & designer" },
        { status: 400 },
      );
    }

    // ✅ Get store currency from Shopify
    const storeCurrency = await getShopCurrency(shop);
    console.log("🏪 Store currency (from Shopify):", storeCurrency);

    // ✅ Conversion
    const originalAmount = parseFloat(price as any) || 0;
    const targetCurrency = "USD";

    console.log("💰 Price conversion input:", {
      originalAmount,
      storeCurrency,
      targetCurrency,
    });

    let convertedAmount: number;
    if (storeCurrency === targetCurrency) {
      convertedAmount = originalAmount;
      console.log("💵 No conversion needed, using original:", convertedAmount);
    } else {
      convertedAmount = await convertCurrency(
        originalAmount,
        storeCurrency,
        targetCurrency,
      );
      console.log("💵 Converted amount:", convertedAmount);
    }

    convertedAmount = parseFloat(convertedAmount.toFixed(2));
    console.log("💵 Final normalized amount (USD):", convertedAmount);

    // ✅ Archive flag
    const inArchiveBoolean = inArchive === "true";
    console.log("📦 inArchive converted:", inArchiveBoolean);

    // ✅ Create record
    console.log("🛠 Creating product royalty entry...");
    const royalty = await prisma.productRoyalty.create({
      data: {
        productId,
        shopifyId: shopifyId || productId,
        title,
        image: image || null,
        status,
        inArchive: inArchiveBoolean,
        designerId,
        royality: parseFloat(royality),
        shop,
        price: {
          amount: convertedAmount,
          currency: targetCurrency,
          storeCurrency, // 🏪 actual shop currency
          storeAmount: originalAmount, // original price in store currency
        },
        expiry: expiryDate, // <-- save expiry
      },
    });
    await prisma.notification.create({
      data: {
        type: "royalty_assigned",
        message: `Royalty assigned for  "${title}" at ${royality}%  Expiry ${expiryDate ? new Date(expiryDate).toLocaleDateString() : "Date not set"}`,
        shop,
        designerId,
      },
    });
    console.log("✅ Royalty and notification created successfully");

    return NextResponse.json({
      message: "Royalty assigned successfully",
      royalty,
    });
  } catch (err: any) {
    console.error("❌ Error creating royalty:", err);
    return NextResponse.json(
      { error: "Something went wrong while assigning royalty." },
      { status: 500 },
    );
  }
}
