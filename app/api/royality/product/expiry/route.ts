import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const shop = url.searchParams.get("shop");
    const { expiryDate } = await req.json();

    if (!shop) {
      return NextResponse.json(
        { success: false, message: "Missing shop parameter" },
        { status: 400 }
      );
    }
    if (!expiryDate) {
      return NextResponse.json(
        { success: false, message: "Missing expiryDate in body" },
        { status: 400 }
      );
    }

    const expiry = new Date(expiryDate);

    const updated = await prisma.productRoyalty.updateMany({
      where: {
        shop,
        // expiry: null, 
      },
      data: {
        expiry,
      },
    });

    return NextResponse.json({
      success: true,
      shop,
      expiryDate: expiry.toISOString(),
      countExpired: updated.count,
    });
  } catch (err: any) {
    console.error("Error in expiry endpoint:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal Error" },
      { status: 500 }
    );
  }
}
