import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const orderId = searchParams.get("orderId");
    const designerId = searchParams.get("designerId");

    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop is required" }, { status: 400 });
    }

    const where: any = { shop };
    if (orderId) where.orderId = orderId;
    if (designerId) where.designerId = designerId;

    // Sab transactions fetch karo
    const transactions = await prisma.royaltyTransaction.findMany({
      where,
      orderBy: { createdAt: "asc" }, // ascending order for proper total calculation
    });

    if (!transactions.length) {
      return NextResponse.json({ success: false, error: "No transactions found" });
    }

    // Total balances calculate karo
    const totalBalanceUsed = transactions.reduce((acc, tx) => acc + (tx.balanceUsed || 0), 0);
    const totalBalanceRemaining = transactions.reduce((acc, tx) => acc + (tx.balanceRemaining || 0), 0);

    // Last transaction
    const latestTransaction = transactions[transactions.length - 1];

    return NextResponse.json({
      success: true,
      totalBalanceUsed,
      totalBalanceRemaining,
      latestTransaction,
      transactions, // sab transactions agar frontend me show karna ho
    });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
