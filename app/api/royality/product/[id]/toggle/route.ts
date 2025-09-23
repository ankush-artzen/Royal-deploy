import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } } // `id` = shopifyId from URL
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json({ error: "Shop is required" }, { status: 400 });
    }

    const body = await req.json();
    const { inArchive } = body;

    if (typeof inArchive !== "boolean") {
      return NextResponse.json(
        { error: "inArchive must be a boolean" },
        { status: 400 }
      );
    }

    // Find royalty by shopifyId + shop
    const royalty = await prisma.productRoyalty.findFirst({
      where: {
        shopifyId: id,
        shop,
      },
    });

    if (!royalty) {
      return NextResponse.json(
        { error: "Royalty record not found" },
        { status: 404 }
      );
    }

    // Toggle archive state
    const updatedRoyalty = await prisma.productRoyalty.update({
      where: { id: royalty.id },
      data: {
        inArchive,
        status: inArchive ? "archived" : "active",
      },
    });

    return NextResponse.json({
      message: `Royalty ${inArchive ? "archived" : "reactivated"} successfully`,
      royalty: updatedRoyalty,
    });
  } catch (err: any) {
    console.error("Error toggling royalty:", err);
    return NextResponse.json(
      { error: "Something went wrong while toggling royalty." },
      { status: 500 }
    );
  }
}
