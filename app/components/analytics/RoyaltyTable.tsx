"use client";
import { IndexTable, InlineStack, Text } from "@shopify/polaris";

export type LineItemStat = {
  productId: string;
  title: string;
  variantId?: string | null;
  variantTitle?: string | null;
  unitSold: number;
  totalSale: number;
  totalRoyalty: number;
  royaltyPercentage: number;
  last30DaysRoyalty: number;
  currency?: string | null;
  convertedCurrencyAmountRoyalty?: number;

};

export type ApiResponse = {
  shop: string;
  products: LineItemStat[];
  totalProducts: number;
  totalUnitSold: number;
  totalSales: number;
  totalRoyalties: number;
  last30DaysTotalRoyalty: number;
  
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function ProductCell({ product }: { product: LineItemStat }) {
  return (
    <InlineStack gap="200" align="start">
      <div>
        <Text as="span" variant="bodyMd" fontWeight="semibold">
          {product.title || "(Untitled product)"}
        </Text>
        <div>ID: {product.productId}</div>
        {product.variantTitle && <div>Variant: {product.variantTitle}</div>}
      </div>
    </InlineStack>
  );
}

