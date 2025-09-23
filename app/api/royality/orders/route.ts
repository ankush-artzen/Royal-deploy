import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ERROR_MESSAGES,
} from "@/lib/constants/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const page = Math.max(
      parseInt(searchParams.get("page") || DEFAULT_PAGE.toString(), 10),
      1,
    );
    const limit = Math.min(
      Math.max(
        parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10),
        1,
      ),
      MAX_LIMIT,
    );

    if (!shop) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_SHOP },
        { status: 400 },
      );
    }

    const skip = (page - 1) * limit;

    const orders = await prisma.royaltyOrder.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        orderId: true,
        orderName: true,
        currency: true,
        createdAt: true,
        calculatedRoyaltyAmount: true,
        convertedCurrencyAmountRoyality: true,
        lineItem: true,
      },
    });

    // Round values in response
    const roundedOrders = orders.map((order) => ({
      ...order,
      calculatedRoyaltyAmount: order.calculatedRoyaltyAmount
        ? Number(order.calculatedRoyaltyAmount.toFixed(2))
        : 0,
      convertedCurrencyAmountRoyality: order.convertedCurrencyAmountRoyality
        ? Number(order.convertedCurrencyAmountRoyality.toFixed(2))
        : 0,
    }));

    const totalOrders = await prisma.royaltyOrder.count({ where: { shop } });

    // Total sums
    const totalCalculatedRoyalty = await prisma.royaltyOrder.aggregate({
      _sum: { calculatedRoyaltyAmount: true, convertedCurrencyAmountRoyality: true },
      where: { shop },
    });

    return NextResponse.json({
      orders: roundedOrders,
      totalCalculatedRoyalty: Number(
        (totalCalculatedRoyalty._sum.calculatedRoyaltyAmount || 0).toFixed(2)
      ),
      totalConvertedRoyalty: Number(
        (totalCalculatedRoyalty._sum.convertedCurrencyAmountRoyality || 0).toFixed(2)
      ),
      totalOrders,
      page,
      limit,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
}
