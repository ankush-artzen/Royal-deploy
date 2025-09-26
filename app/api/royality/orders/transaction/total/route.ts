import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const shop = req.nextUrl.searchParams.get("shop");
    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    const transactions = await prisma.royaltyTransaction.findMany({
      where: { shop },
      select: { price: true, royaltyPercentage: true },
    });

    const totalTransactions = transactions.length;

    const totalRevenue = transactions.reduce((sum, tx) => {
      const usd = (tx.price as any)?.usd || 0;
      return sum + usd;
    }, 0);

    const avgRoyalty =
      totalTransactions > 0
        ? transactions.reduce((sum, tx) => sum + (tx.royaltyPercentage || 0), 0) /
          totalTransactions
        : 0;

    return NextResponse.json({
      totalTransactions,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      avgRoyalty: parseFloat(avgRoyalty.toFixed(1)),
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch royalty summary" },
      { status: 500 }
    );
  }
}
