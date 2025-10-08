"use client";

import React, { useEffect } from "react";
import {
  Modal,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Divider,
  Box,
  Banner,
} from "@shopify/polaris";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/redux/store";
import { fetchExchangeRate } from "@/app/redux/currencySlice";
import { useShopCurrency } from "@/app/hooks/shopCurrency";
import moment from "moment";

interface LineItemVariant {
  variantTitle: string;
  quantity: number;
  unitPrice: number;
  royality: number;
  royaltyPercentage: number;
}

interface LineItemProduct {
  productId: string;
  title: string;
  variants: LineItemVariant[];
}

const OrderModal: React.FC<OrderModalProps> = ({
  order,
  storeName,
  active,
  onClose,
  loading = false,
}) => {
  const shop = storeName + ".myshopify.com";
  const dispatch = useDispatch();
  const rates = useSelector((state: RootState) => state.currency.rates);
  const { currency: shopCurrency, loading: currencyLoading } =
    useShopCurrency(shop);

  useEffect(() => {
    const key = `${order.currency}-USD`;
    if (!rates[key]) {
      (dispatch as any)(fetchExchangeRate({ from: order.currency, to: "USD" }));
    }
  }, [order.currency, rates, dispatch]);

  const transactions = order.transactions || [];

  return (
    <Modal
      open={active}
      onClose={onClose}
      title={`Order ${order.orderName}`}
      primaryAction={{ content: "Close", onAction: onClose }}
      secondaryActions={[
        {
          content: "View in Shopify",
          onAction: () => {
            window.open(
              `https://admin.shopify.com/store/${storeName}/orders/${order.orderId}`,
              "_blank",
            );
          },
        },
      ]}
      size="large"
    >
      <BlockStack gap="400">
        {/* Order Summary */}
        <Card>
          <BlockStack gap="400">
            <Banner title="Order Summary Info" tone="info" />

            <Divider />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "200px 1fr",
                rowGap: "16px",
                columnGap: "24px",
                alignItems: "center",
              }}
            >
              <Text as="span" tone="subdued" fontWeight="semibold">
                Order Date
              </Text>
              <Text as="span" fontWeight="regular">
                {order.createdAt ? moment(order.createdAt).format("lll") : "-"}
              </Text>

              <Text as="span" tone="subdued" fontWeight="semibold">
                Order ID
              </Text>
              <Text as="span" fontWeight="regular">
                {order.orderId}
              </Text>

              <Text as="span" tone="subdued" fontWeight="semibold">
                Total Royalty Amount
              </Text>
              <Text as="span" fontWeight="bold" variant="headingMd">
                {currencyLoading
                  ? "Loading..."
                  : `${shopCurrency} ${order.convertedCurrencyAmountRoyality.toFixed(2)}`}
              </Text>
            </div>
          </BlockStack>
        </Card>

        {/* Products */}
        <Card>
          <BlockStack gap="400">
            <Banner title="Products Info" tone="info" />

            <Divider />

            {order.lineItem && order.lineItem.length > 0 ? (
              <BlockStack gap="400">
                {Object.values(
                  order.lineItem.reduce(
                    (acc: Record<string, LineItemProduct>, item) => {
                      if (!acc[item.productId]) {
                        acc[item.productId] = {
                          productId: item.productId,
                          title: item.title,
                          variants: [],
                        };
                      }

                      acc[item.productId].variants.push({
                        variantTitle: item.variantTitle || "Default Variant",
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        royality: item.royality,
                        royaltyPercentage: item.royaltyPercentage,
                      });

                      return acc;
                    },
                    {},
                  ),
                ).map((product) => {
                  const relatedTx = transactions.find(
                    (tx) => tx.productId === product.productId,
                  );
                  const status = relatedTx?.status || null;

                  return (
                    <Card key={product.productId} padding="400">
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingMd" fontWeight="semibold">
                          {product.title || "Unknown Product"}
                        </Text>

                        {/* Variants */}
                        <BlockStack gap="300">
                          {product.variants.map((v, i) => (
                            <React.Fragment key={i}>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "200px 1fr",
                                  rowGap: "12px",
                                  columnGap: "24px",
                                  alignItems: "center",
                                }}
                              >
                                <Text
                                  as="span"
                                  tone="subdued"
                                  fontWeight="semibold"
                                >
                                  Variant:
                                </Text>
                                <Text as="span" fontWeight="medium">
                                  {v.variantTitle}
                                </Text>

                                <Text
                                  as="span"
                                  tone="subdued"
                                  fontWeight="semibold"
                                >
                                  Quantity:
                                </Text>
                                <Text as="span">{v.quantity}</Text>

                                <Text
                                  as="span"
                                  tone="subdued"
                                  fontWeight="semibold"
                                >
                                  Unit Price:
                                </Text>
                                <Text as="span">
                                  {currencyLoading
                                    ? "Loading..."
                                    : `${shopCurrency} ${(v.unitPrice * (rates[`${order.currency}-USD`] || 1)).toFixed(2)}`}
                                </Text>

                                <Text
                                  as="span"
                                  tone="subdued"
                                  fontWeight="semibold"
                                >
                                  Royalty %:
                                </Text>
                                <Text as="span">
                                  {typeof v.royaltyPercentage === "number"
                                    ? v.royaltyPercentage.toFixed(2) + "%"
                                    : "-"}
                                </Text>
                              </div>

                              {/* Divider between variants */}
                              {i < product.variants.length - 1 && (
                                <Box paddingBlockStart="200">
                                  <Divider />
                                </Box>
                              )}
                            </React.Fragment>
                          ))}
                        </BlockStack>
                      </BlockStack>
                    </Card>
                  );
                })}
              </BlockStack>
            ) : (
              <Text as="p" tone="subdued">
                No products found
              </Text>
            )}
          </BlockStack>
        </Card>

        {/* Transactions */}
        <Card>
          <BlockStack gap="400">
            {/* Banner with dynamic transaction count */}
            <Banner
              title={`Transactions (${transactions.length})`}
              tone="info"
            />

            <Divider />

            {transactions.length > 0 ? (
              <BlockStack gap="300">
                {transactions.map((tx) => (
                  <Card key={tx.id} padding="400">
                    <BlockStack gap="300">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "200px 1fr",
                          rowGap: "12px",
                          columnGap: "24px",
                          alignItems: "center",
                        }}
                      >
                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Charge ID:
                        </Text>
                        <Text as="span" fontWeight="medium">
                          {tx.shopifyTransactionChargeId}
                        </Text>

                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Royalty %:
                        </Text>
                        <Text as="span">
                          {typeof tx.royaltyPercentage === "number"
                            ? tx.royaltyPercentage.toFixed(2) + "%"
                            : "-"}
                        </Text>

                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Royalty Price:
                        </Text>
                        <Text as="span" fontWeight="bold" variant="headingMd">
                          {currencyLoading
                            ? "Loading..."
                            : `${shopCurrency} ${tx.price.usd.toFixed(2)}`}
                        </Text>

                        {tx.description && (
                          <>
                            <Text
                              as="span"
                              tone="subdued"
                              fontWeight="semibold"
                            >
                              Description:
                            </Text>
                            <Text as="span" tone="subdued">
                              {tx.description}
                            </Text>
                          </>
                        )}

                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Status:
                        </Text>
                        <Text
                          as="span"
                          variant="headingMd"
                          tone={
                            tx.status === "success"
                              ? "success"
                              : tx.status === "pending"
                                ? "critical"
                                : "critical"
                          }
                          fontWeight="bold"
                        >
                          {tx.status.charAt(0).toUpperCase() +
                            tx.status.slice(1)}
                        </Text>
                      </div>
                    </BlockStack>
                  </Card>
                ))}
              </BlockStack>
            ) : (
              <Text as="p" tone="subdued">
                No transactions found
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Modal>
  );
};

export default OrderModal;
