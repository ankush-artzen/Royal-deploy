import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";
import { DEFAULT_PAGE, DEFAULT_LIMIT } from "@/lib/constants/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const shop = searchParams.get("shop");
    const designerId = searchParams.get("designerId");
    const productId = searchParams.get("productId");
    const status = searchParams.get("status");

    let page = Number(searchParams.get("page") || DEFAULT_PAGE);
    const limit = Number(searchParams.get("limit") || DEFAULT_LIMIT);

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 },
      );
    }

    // Build dynamic query (include archived + active)
    const where: any = { shop };
    if (designerId) where.designerId = designerId;
    if (productId) where.productId = productId;
    if (status) where.status = status;

    // Count total items matching the filter
    const totalCount = await prisma.productRoyalty.count({ where });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit) || 1;

    // Clamp page number
    page = Math.min(Math.max(page, 1), totalPages);

    // Fetch paginated data, newest first
    const royalties = await prisma.productRoyalty.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Map price & royalty to frontend
    const formattedRoyalties = royalties.map((r) => ({
      ...r,
      Royality: r.royality ?? 0,
      price: r.price || {
        amount: 0,
        currency: "USD",
        storeAmount: 0,
        storeCurrency: "INR",
      },
    }));

    return NextResponse.json({
      royalties: formattedRoyalties,
      count: totalCount,
      page,
      totalPages,
    });
  } catch (err: any) {
    console.error("Error fetching royalty products:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
