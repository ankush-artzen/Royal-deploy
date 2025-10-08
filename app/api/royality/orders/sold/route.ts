import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

export const dynamic = "force-dynamic";

interface LineItemStat {
  productId: string;
  title: string;
  variantId: string | null;
  variantTitle: string | null;
  unitSold: number;
  totalSale: number;
  totalRoyalty: number;
  royaltyPercentage: number;
  last30DaysRoyalty: number;
  image: string | null;
  price: number | null;
  currency: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get("shop");
    const query = searchParams.get("query")?.trim().toLowerCase() || "";
    const sortKey = (searchParams.get("sortKey") as keyof LineItemStat) || "totalRoyalty";
    const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "10"));

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Build common match stages
    const baseMatch: any[] = [{ $match: { shop } }];

    if (query) {
      baseMatch.push(
        { $unwind: "$lineItem" },
        {
          $match: {
            $or: [
              { "lineItem.title": { $regex: query, $options: "i" } },
              { "lineItem.productId": { $regex: query, $options: "i" } },
              { "lineItem.variantTitle": { $regex: query, $options: "i" } },
            ],
          },
        }
      );
    } else {
      baseMatch.push({ $unwind: "$lineItem" });
    }

    // ------------------------
    // Step 1: Count total products (filtered)
    // ------------------------
    const totalCountPipeline: any[] = [
      ...baseMatch,
      {
        $group: {
          _id: { productId: "$lineItem.productId", variantId: "$lineItem.variantId" },
        },
      },
      { $count: "total" },
    ];

    const totalResult: any = await prisma.$runCommandRaw({
      aggregate: "RoyaltyOrder",
      pipeline: totalCountPipeline,
      cursor: {},
    });

    const totalProducts = totalResult.cursor?.firstBatch?.[0]?.total ?? 0;

    // ------------------------
    // Step 2: Aggregate with pagination (same filter)
    // ------------------------
    const pipeline: any[] = [
      ...baseMatch,
      {
        $group: {
          _id: { productId: "$lineItem.productId", variantId: "$lineItem.variantId" },
          productId: { $first: "$lineItem.productId" },
          title: { $first: "$lineItem.title" },
          variantId: { $first: "$lineItem.variantId" },
          variantTitle: { $first: "$lineItem.variantTitle" },
          unitSold: { $sum: "$lineItem.quantity" },
          totalSale: { $sum: { $multiply: ["$lineItem.quantity", "$lineItem.unitPrice"] } },
          totalRoyalty: { $sum: "$lineItem.productRoyaltyAmount" },
          royaltyPercentage: { $avg: "$lineItem.royaltyPercentage" },
          last30DaysRoyalty: {
            $sum: {
              $cond: [
                { $gte: ["$createdAt", thirtyDaysAgo] },
                "$lineItem.productRoyaltyAmount",
                0,
              ],
            },
          },
          currency: { $first: "$currency" },
        },
      },
      { $sort: { [sortKey]: sortDir === "asc" ? 1 : -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
    ];

    const rawProducts: LineItemStat[] = await prisma.$runCommandRaw({
      aggregate: "RoyaltyOrder",
      pipeline,
      cursor: {},
    }).then((res: any) => res.cursor.firstBatch);

    // ------------------------
    // Step 3: Enrich with image & price
    // ------------------------
    const productIds = rawProducts.map((p) => p.productId);
    const dbProducts = await prisma.productRoyalty.findMany({
      where: { shop, productId: { in: productIds } },
      select: { productId: true, image: true, price: true },
    });
    const dbProductMap = new Map(dbProducts.map((p) => [p.productId, p]));

    const products = rawProducts.map((p) => {
      const dbProduct = dbProductMap.get(p.productId);
      let price: number | null = null;
      if (dbProduct?.price !== undefined && dbProduct?.price !== null) {
        const parsed = Number(dbProduct.price);
        price = isNaN(parsed) ? null : parsed;
      }
      return { ...p, image: dbProduct?.image || null, price };
    });

    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

    return NextResponse.json({
      shop,
      products,
      totalProducts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching product royalty stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
