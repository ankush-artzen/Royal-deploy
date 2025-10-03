import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { PAGINATION, DATE_RANGE } from "@/lib/constants/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const shop = searchParams.get("shop");
    const orderId = searchParams.get("orderId");
    const designerId = searchParams.get("designerId");

    const page = Math.max(
      parseInt(
        searchParams.get("page") || PAGINATION.DEFAULT_PAGE.toString(),
        10,
      ),
      1,
    );
    const limit = Math.min(
      Math.max(
        parseInt(
          searchParams.get("limit") || PAGINATION.DEFAULT_LIMIT.toString(),
          10,
        ),
        1,
      ),
      PAGINATION.MAX_LIMIT,
    );

    const endDate = searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : new Date();

    const startDate = searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : new Date(
          new Date().setDate(endDate.getDate() - DATE_RANGE.DEFAULT_DAYS),
        );

    const where: any = {
      createdAt: { gte: startDate, lte: endDate },
    };
    if (shop) where.shop = shop;
    if (orderId) where.orderId = orderId;
    if (designerId) where.designerId = designerId;

    console.log("📌 Prisma query filter:", where);

    const totalCount = await prisma.royaltyTransaction.count({ where });

    const transactions = await prisma.royaltyTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    type PriceJson = {
      storeprice?: number;
      storeCurrency?: string;
      usd?: number;
    };

    const sanitizedTransactions = transactions.map((tx) => {
      const price = tx.price as PriceJson | null;

      return {
        id: tx.id,
        shop: tx.shop,
        shopifyTransactionChargeId: tx.shopifyTransactionChargeId || "N/A",
        orderId: tx.orderId,
        orderName: tx.orderName || "N/A",
        productId: tx.productId || "N/A",
        description: tx.description || "",
        price: price
          ? {
              storeprice: price.storeprice ?? null,
              storeCurrency: price.storeCurrency ?? null,
              usd: price.usd ?? null,
            }
          : { storeprice: null, storeCurrency: null, usd: null },
        currency: tx.currency || "USD",
        status: tx.status || "pending", 

        balanceUsed: tx.balanceUsed || 0,
        balanceRemaining: tx.balanceRemaining || 0,
        royaltyPercentage: tx.royaltyPercentage || 0,
        designerId: tx.designerId || "N/A",
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      transactions: sanitizedTransactions,
    });
  } catch (error: any) {
    console.error("❌ Error fetching RoyaltyTransactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch RoyaltyTransactions",
      },
      { status: 500 },
    );
  }
}
