import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 }
      );
    }

    // --- Aggregated totals directly in MongoDB ---
    const [totals] = (await prisma.royaltyOrder.aggregateRaw({
      pipeline: [
        { $match: { shop } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRoyaltyAmount: { $sum: "$calculatedRoyaltyAmount" },
            totalLineItemRoyalty: {
              $sum: { $sum: "$lineItem.productRoyaltyAmount" },
            },
            totalConvertedRoyalty: { $sum: "$convertedCurrencyAmountRoyality" },
          },
        },
      ],
    })) as unknown as {
      totalOrders: number;
      totalRoyaltyAmount: number;
      totalLineItemRoyalty: number;
      totalConvertedRoyalty: number;
    }[];

    // --- Top product by totalSold ---
    const topProduct = await prisma.productRoyalty.findFirst({
      where: { shop },
      orderBy: { totalSold: "desc" },
      select: {
        title: true,
        productId: true,
        totalSold: true,
        price: true,
        royality: true,
      },
    });

    return NextResponse.json({
      totalOrders: totals?.totalOrders ?? 0,
      totalRoyaltyAmount: totals?.totalRoyaltyAmount ?? 0,
      totalLineItemRoyalty: totals?.totalLineItemRoyalty ?? 0,
      totalConvertedRoyalty: totals?.totalConvertedRoyalty ?? 0,
      topProduct: topProduct || null,
    });
  } catch (error: any) {
    console.error("Error fetching totals:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
