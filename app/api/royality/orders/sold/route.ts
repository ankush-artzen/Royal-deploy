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

    // Step 1: Aggregate using MongoDB pipeline
    const pipeline: any[] = [
      { $match: { shop } },
      { $unwind: "$lineItem" },
    ];

    if (query) {
      pipeline.push({
        $match: {
          $or: [
            { "lineItem.title": { $regex: query, $options: "i" } },
            { "lineItem.productId": { $regex: query, $options: "i" } },
            { "lineItem.variantTitle": { $regex: query, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
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
              $cond: [{ $gte: ["$createdAt", thirtyDaysAgo] }, "$lineItem.productRoyaltyAmount", 0],
            },
          },
          currency: { $first: "$currency" },
        },
      }
    );

    const rawProducts: LineItemStat[] = await prisma.$runCommandRaw({
      aggregate: "RoyaltyOrder",
      pipeline,
      cursor: {},
    }).then((res: any) => res.cursor.firstBatch);

    // Step 2: Enrich with productRoyalty (price & image)
    const productIds = rawProducts.map((p) => p.productId);
    const dbProducts = await prisma.productRoyalty.findMany({
      where: { shop, productId: { in: productIds } },
      select: { productId: true, image: true, price: true },
    });
    const dbProductMap = new Map(dbProducts.map((p) => [p.productId, p]));

    let products = rawProducts.map((p) => {
      const dbProduct = dbProductMap.get(p.productId);
      let price: number | null = null;
      if (dbProduct?.price !== undefined && dbProduct?.price !== null) {
        const parsed = Number(dbProduct.price);
        price = isNaN(parsed) ? null : parsed;
      }
      return { ...p, image: dbProduct?.image || null, price };
    });

    // Step 3: Sorting
    products.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const aValue = a[sortKey] ?? 0;
      const bValue = b[sortKey] ?? 0;
      if (typeof aValue === "number" && typeof bValue === "number") return (aValue - bValue) * dir;
      return String(aValue).localeCompare(String(bValue)) * dir;
    });

    // Step 4: Pagination
    const totalProducts = products.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedProducts = products.slice(startIndex, startIndex + pageSize);

    // Step 5: Totals
    const totalUnitSold = products.reduce((sum, p) => sum + p.unitSold, 0);
    const totalSales = products.reduce((sum, p) => sum + p.totalSale, 0);
    const totalRoyalties = products.reduce((sum, p) => sum + p.totalRoyalty, 0);
    const last30DaysTotalRoyalty = products.reduce((sum, p) => sum + p.last30DaysRoyalty, 0);

    return NextResponse.json({
      shop,
      products: paginatedProducts,
      totalProducts,
      totalUnitSold,
      totalSales,
      totalRoyalties,
      last30DaysTotalRoyalty,
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    });
  } catch (error) {
    console.error("Error fetching product royalty stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
