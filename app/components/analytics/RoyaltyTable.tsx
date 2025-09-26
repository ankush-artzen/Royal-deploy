"use client";
import { InlineStack, Text } from "@shopify/polaris";

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
