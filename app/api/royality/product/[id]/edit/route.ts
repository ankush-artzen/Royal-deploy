import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import {
  ROYALTY,
  ERROR_MESSAGES_edit,
  SUCCESS_MESSAGES,
} from "@/lib/constants/constants";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.MISSING_SHOP },
        { status: 400 },
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.MISSING_PRODUCT_ID },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { Royality, expiry } = body;

    const updateData: any = {};

    // ✅ Validate Royality if provided
    if (Royality !== undefined) {
      const numericRoyalty = parseFloat(Royality);
      if (
        isNaN(numericRoyalty) ||
        numericRoyalty < ROYALTY.MIN ||
        numericRoyalty > ROYALTY.MAX
      ) {
        return NextResponse.json(
          { error: ERROR_MESSAGES_edit.INVALID_ROYALTY },
          { status: 400 },
        );
      }
      updateData.royality = numericRoyalty;
    }

    // ✅ Validate expiry if provided
    if (expiry !== undefined) {
      const parsed = new Date(expiry);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid expiry date format" },
          { status: 400 },
        );
      }
      updateData.expiry = parsed;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided (Royality or expiry required)" },
        { status: 400 },
      );
    }

    // ✅ Find royalty record
    const royalty = await prisma.productRoyalty.findFirst({
      where: { shopifyId: id, shop },
    });

    if (!royalty) {
      return NextResponse.json(
        { error: ERROR_MESSAGES_edit.ROYALTY_NOT_FOUND },
        { status: 404 },
      );
    }

    // ✅ Update royalty
    const updatedRoyalty = await prisma.productRoyalty.update({
      where: { id: royalty.id },
      data: updateData,
    });
    // ✅ Create notification entry
    // await prisma.notification.create({
    //   data: {
    //     type: "royalty_assigned",
    //     message: `Royalty updated for "${royalty.title}" - New rate: ${
    //       updateData.royality ?? royalty.royality
    //     }% - Expires ${
    //       updateData.expiry
    //         ? new Date(updateData.expiry).toLocaleDateString()
    //         : royalty.expiry
    //         ? new Date(royalty.expiry).toLocaleDateString()
    //         : "Never"
    //     }`,
    //     shop,
    //     designerId: royalty.designerId,
    //   },
    // });

    // console.log("✅ Royalty and notification updated successfully");

    return NextResponse.json({
      message: SUCCESS_MESSAGES.ROYALTY_UPDATED,
      royalty: updatedRoyalty,
    });
  } catch (error: any) {
    console.error("❌ Error updating royalty:", error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES_edit.INTERNAL_SERVER_ERROR },
      { status: 500 },
    );
  }
}
