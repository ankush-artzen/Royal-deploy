import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma-connect";

// Type definitions
type LineItemStat = {
  productId: string;
  title: string;
  variantId?: string | null;
  variantTitle?: string | null;
  unitSold: number;
  totalSale: number;
  totalRoyalty: number;
  royaltyPercentage: number;
  last30DaysRoyalty: number;
  image?: string | null;
  price?: number | null;
  currency?: string | null;
};

type ApiResponse = {
  shop: string;
  products: LineItemStat[];
  totalProducts: number;
  totalUnitSold: number;
  totalSales: number;
  totalRoyalties: number;
  totalConvertedRoyalty: number;
  last30DaysTotalRoyalty: number;
  last30DaysConvertedRoyalty: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Query parameters
    const shop = searchParams.get("shop");
    const query = searchParams.get("query")?.trim().toLowerCase() || "";
    const sortKey =
      (searchParams.get("sortKey") as keyof LineItemStat) || "totalRoyalty";
    const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.max(
      1,
      parseInt(searchParams.get("pageSize") || "10"),
    );

    if (!shop) {
      return NextResponse.json(
        { error: "Missing shop parameter" },
        { status: 400 },
      );
    }

    // Fetch royalty orders with line items
    const royaltyOrders = await prisma.royaltyOrder.findMany({
      where: { shop },
      include: { lineItem: true },
      orderBy: { createdAt: "desc" },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate stats by product+variant
    const productStatsMap = new Map<string, LineItemStat>();
    let totalConvertedRoyalty = 0;
    let last30DaysConvertedRoyalty = 0;

    royaltyOrders.forEach((order) => {
      const isRecentOrder = order.createdAt >= thirtyDaysAgo;

      const orderRoyalty = order.convertedCurrencyAmountRoyality || 0;
      totalConvertedRoyalty += orderRoyalty;
      if (isRecentOrder) last30DaysConvertedRoyalty += orderRoyalty;

      order.lineItem.forEach((item) => {
        const key = `${item.productId}-${item.variantId || "no-variant"}`;
        const existing = productStatsMap.get(key);
        const itemTotalSale = (item.unitPrice || 0) * (item.quantity || 0);
        const itemRoyalty = item.productRoyaltyAmount || 0;

        if (existing) {
          existing.unitSold += item.quantity;
          existing.totalSale += itemTotalSale;
          existing.totalRoyalty += itemRoyalty;
          if (isRecentOrder) existing.last30DaysRoyalty += itemRoyalty;
        } else {
          productStatsMap.set(key, {
            productId: item.productId,
            title: item.title || "Unknown Product",
            variantId: item.variantId || null,
            variantTitle: item.variantTitle || null,
            unitSold: item.quantity,
            totalSale: itemTotalSale,
            totalRoyalty: itemRoyalty,
            royaltyPercentage: item.royaltyPercentage || 0,
            last30DaysRoyalty: isRecentOrder ? itemRoyalty : 0,
            image: null,
            price: null,
            currency: order.currency || null,
          });
        }
      });
    });

    // Convert map to array
    let products: LineItemStat[] = Array.from(productStatsMap.values());

    // Enrich with image & price
    const productIds = Array.from(new Set(products.map((p) => p.productId)));
    const dbProducts = await prisma.productRoyalty.findMany({
      where: { shop, productId: { in: productIds } },
      select: { productId: true, image: true, price: true },
    });
    const dbProductMap = new Map(dbProducts.map((p) => [p.productId, p]));

    products = products.map((p) => {
      const dbProduct = dbProductMap.get(p.productId);
      let price: number | null = null;

      if (dbProduct?.price !== undefined && dbProduct?.price !== null) {
        const parsed = Number(dbProduct.price);
        price = isNaN(parsed) ? null : parsed;
      }

      return {
        ...p,
        image: dbProduct?.image || null,
        price,
      };
    });

    // Apply search filter
    if (query) {
      products = products.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.productId?.toLowerCase().includes(query) ||
          p.variantTitle?.toLowerCase().includes(query),
      );
    }

    // Sorting
    products.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * dir;
      }
      return String(aValue).localeCompare(String(bValue)) * dir;
    });

    // Totals
    const totalUnitSold = products.reduce((sum, p) => sum + p.unitSold, 0);
    const totalSales = products.reduce((sum, p) => sum + p.totalSale, 0);
    const totalRoyalties = products.reduce((sum, p) => sum + p.totalRoyalty, 0);
    const last30DaysTotalRoyalty = products.reduce(
      (sum, p) => sum + p.last30DaysRoyalty,
      0,
    );

    // Pagination
    const totalProducts = products.length;
    const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedProducts = products.slice(startIndex, startIndex + pageSize);

    // Return response
    return NextResponse.json({
      shop,
      products: paginatedProducts,
      totalProducts,
      totalUnitSold,
      totalSales,
      totalRoyalties,
      totalConvertedRoyalty: +totalConvertedRoyalty.toFixed(7),
      last30DaysTotalRoyalty,
      last30DaysConvertedRoyalty: +last30DaysConvertedRoyalty.toFixed(7),
      currentPage,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    } as ApiResponse);
  } catch (error) {
    console.error("Error fetching product royalty stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
