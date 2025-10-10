import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { findSessionsByShop } from "@/lib/db/session-storage";

export const dynamic = "force-dynamic";


const API_VERSION = "2025-07";

// async function getShopCurrency(shop: string) {
//   const sessions = await findSessionsByShop(shop);
//   const session = Array.isArray(sessions) ? sessions[0] : sessions;
//   if (!session?.accessToken) {
//     throw new Error("Missing session for shop: " + shop);
//   }

//   const resp = await fetch(`https://${shop}/admin/api/${API_VERSION}/shop.json`, {
//     headers: {
//       "X-Shopify-Access-Token": session.accessToken,
//       "Content-Type": "application/json",
//     },
//   });

//   if (!resp.ok) {
//     const errText = await resp.text();
//     throw new Error(`Failed to fetch shop info: ${resp.statusText} - ${errText}`);
//   }

//   const data = await resp.json();
//   return data.shop.currency as string;
// }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    // Fetch shop currency once
    // const shopCurrency = await getShopCurrency(shop);

    // Fetch all product royalties for the shop
    const royalties = await prisma.productRoyalty.findMany({
      where: { shop },
    });

    // Include the shop currency for all products
    const royaltiesWithCurrency = royalties.map((r) => ({
      ...r,
      // currency: shopCurrency,
    }));

    return NextResponse.json({
      royalties: royaltiesWithCurrency,
      totalProducts: royaltiesWithCurrency.length,
      // shopCurrency,
    });
  } catch (error: any) {
    console.error("Error fetching royalties:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
