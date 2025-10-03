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

    const product = await prisma.productRoyalty.findFirst({
      where: {
        shop,
        price: { not: null },
      },
      select: {
        price: true,
      },
    });

    const storeCurrency =
      typeof product?.price === "object" && product.price !== null
        ? (product.price as { currency?: string }).currency || " "
        : " ";

    return NextResponse.json({ storeCurrency });
  } catch (error: any) {
    console.error("Error fetching ", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
