import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 },
      );
    }

    console.log("🔍 Fetching capped amount for shop:", shop);

    const subscription = await prisma.royaltySubscription.findUnique({
      where: { shop },
      select: {
        cappedAmount: true,
        currency: true,
        chargeId: true,
        status: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 },
      );
    }
    // console.log("subvcriptionmnmnm", subscription);

    return NextResponse.json({
      cappedAmount: subscription.cappedAmount,
      currency: subscription.currency,
      chargeId: subscription.chargeId,
      status: subscription.status,
    });
  } catch (err) {
    console.error("❌ Error fetching capped amount:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
