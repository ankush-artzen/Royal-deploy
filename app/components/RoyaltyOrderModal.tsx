"use client";

import React from "react";
import {
  Modal,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Divider,
  Box,
} from "@shopify/polaris";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/app/redux/store";
import { fetchExchangeRate } from "@/app/redux/currencySlice";
import { useEffect } from "react";


interface OrderModalProps {
  order: RoyaltyOrder;
  storeName: string;
  active: boolean;
  onClose: () => void;
  loading?: boolean;
}

const OrderModal: React.FC<OrderModalProps> = ({
  order,
  storeName,
  active,
  onClose,
  loading = false,
}) => {
  const dispatch = useDispatch();
  const rates = useSelector((state: RootState) => state.currency.rates);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const renderCurrencyBadge = (currency: string) => (
    <Badge tone={currency === "USD" ? "success" : "warning"}>{currency}</Badge>
  );
  useEffect(() => {
    order.lineItem.forEach((item) => {
      const key = `${order.currency}-USD`;
      if (!rates[key]) {
        (dispatch as any)(
          fetchExchangeRate({ from: order.currency, to: "USD" }),
        );
      }
    });
  }, [order.lineItem, rates, dispatch, order.currency]);
  const transactions = order.transactions || [];

  const renderProductRow = (product: LineItem) => (
    <Box paddingBlock="200">
      <InlineStack align="start" blockAlign="center">
        <Text as="h3" variant="headingMd">
          {product.title || "Unknown Product"}
        </Text>
      </InlineStack>

      <Box paddingBlockStart="100">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px 1fr", // labels | values
            rowGap: "16px", // equal spacing between rows
            columnGap: "24px",
            alignItems: "center",
          }}
        >
          {product.variantTitle && (
            <>
              <Text as="span" tone="subdued">
                Variant:
              </Text>
              <Text as="span">{product.variantTitle}</Text>
            </>
          )}

          <Text as="span" tone="subdued">
            Qty:
          </Text>
          <Text as="span">{product.quantity}</Text>

          <Text as="span" tone="subdued">
            Unit Price:
          </Text>
          <Text as="span">
            {product.unitPrice.toFixed(2)} {order.currency}
          </Text>

          <Text as="span" tone="subdued">
            Royalty %:
          </Text>
          <Text as="span">{product.royaltyPercentage}%</Text>
        </div>
      </Box>
    </Box>
  );

  const renderTransactionRow = (tx: Transaction) => (
    <Box paddingBlock="200">
      <InlineStack align="space-between" blockAlign="center">
        <Text as="span" fontWeight="medium">
          Charge ID: {tx.shopifyTransactionChargeId}
        </Text>
        <Text as="h2" fontWeight="bold">
          Royalty Price : {tx.price.storeprice.toFixed(2)}{" "}
          {tx.price.storeCurrency}
        </Text>
        {/* <Text as="h2">
          Royalty Price (USD): {tx.price.usd.toFixed(2)} {tx.currency}
        </Text> */}

        <Text as="h2">
          Royalty %:{" "}
          {typeof tx.royaltyPercentage === "number"
            ? `${tx.royaltyPercentage.toFixed(2)}`
            : "-"}
        </Text>
        {/*
        // Uncomment if you want balance info
        <Text as="h2">
          Balance Used: {tx.balanceUsed.toFixed(2)} {tx.currency}
        </Text>
        <Text as="h2">
          Balance Remaining: {tx.balanceRemaining.toFixed(2)} {tx.currency}
        </Text>
        */}
      </InlineStack>
      {tx.description && (
        <Text as="span" tone="subdued">
          Description: {tx.description}
        </Text>
      )}
    </Box>
  );

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
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text as="h2" variant="headingLg">
                Order Summary
              </Text>
              {/* {renderCurrencyBadge(order.currency)} */}
            </InlineStack>

            <Divider />

            <InlineStack gap="200">
              <Text as="span" tone="subdued">
                Order Date
              </Text>
              <Text as="span" fontWeight="medium">
                {order.createdAt ? formatDate(order.createdAt) : "-"}
              </Text>
            </InlineStack>

            <InlineStack gap="400">
              <Text as="span" tone="subdued">
                Order ID
              </Text>
              <Text as="span" fontWeight="medium">
                {order.orderId}
              </Text>
            </InlineStack>

            <InlineStack gap="400">
              <Text as="span" tone="subdued">
                Total Royalty Amount
              </Text>
              <Text as="span" fontWeight="bold" variant="headingMd">
                USD {order.convertedCurrencyAmountRoyality.toFixed(2)}{" "}
                {/* {order.currency === "INR" && (
                  <>
                    ({order.calculatedRoyaltyAmount.toFixed(2)} {order.currency}
                    )
                  </>
                )} */}
              </Text>
            </InlineStack>

            {/* {/*
             converted currency */}
            {/* <InlineStack align="space-between">
              <Text as="span" tone="subdued">
                Total Royalty Amount (USD)
              </Text>
              <Text as="span" fontWeight="bold" variant="headingMd">
                ${order.convertedCurrencyAmountRoyality.toFixed(2)}
              </Text>
            </InlineStack> */}
          </BlockStack>
        </Card>

        {/* Products */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              Products ({order.lineItem?.length || 0})
            </Text>
            <Divider />

            {order.lineItem && order.lineItem.length > 0 ? (
              <BlockStack gap="300">
                {Object.values(
                  order.lineItem.reduce(
                    (
                      acc: Record<
                        string,
                        {
                          productId: string;
                          title: string;
                          variants: {
                            variantTitle: string;
                            quantity: number;
                            unitPrice: number;
                            royality: number;
                            royaltyPercentage: number;
                          }[];
                        }
                      >,
                      item,
                    ) => {
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
                ).map((product) => (
                  <Card key={product.productId}>
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingMd" fontWeight="semibold">
                        {product.title || "Unknown Product"}
                      </Text>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 80px 140px 100px",
                          gap: "16px",
                          alignItems: "center",
                        }}
                      >
                        {/* Header */}
                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Variant
                        </Text>
                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Qty
                        </Text>
                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Unit Price
                        </Text>
                        <Text as="span" tone="subdued" fontWeight="semibold">
                          Royalty %
                        </Text>

                        {/* Data rows */}
                        {product.variants.map((v, i) => (
                          <React.Fragment key={i}>
                            <Text as="span" fontWeight="medium">
                              {v.variantTitle}
                            </Text>
                            <Text as="span">{v.quantity}</Text>
                            <Text as="span">
                              {rates[`${order.currency}-USD`]
                                ? (
                                    v.unitPrice * rates[`${order.currency}-USD`]
                                  ).toFixed(2) + " USD"
                                : "—"}
                            </Text>
                            <Badge tone="info">
                              {typeof v.royaltyPercentage === "number"
                                ? v.royaltyPercentage.toFixed(2) + "%"
                                : "-"}
                            </Badge>
                          </React.Fragment>
                        ))}
                      </div>
                    </BlockStack>
                  </Card>
                ))}
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
            <Text as="h2" variant="headingLg">
              Transactions ({order.transactions?.length || 0})
            </Text>
            <Divider />

            {transactions.length > 0 ? (
              <BlockStack gap="300">
                {transactions.map((tx, idx) => (
                  <Box key={tx.id} padding="300">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="span" fontWeight="medium">
                          Charge ID: {tx.shopifyTransactionChargeId}
                        </Text>

                        {/* <Badge tone="success">{tx.price.storeCurrency}</Badge> */}
                      </InlineStack>

                      <InlineStack gap="400" blockAlign="center">
                        <Text as="span" tone="subdued">
                          Royalty %
                        </Text>
                        <Badge tone="info">
                          {typeof tx.royaltyPercentage === "number"
                            ? tx.royaltyPercentage.toFixed(2) + "%"
                            : "-"}
                        </Badge>
                      </InlineStack>

                      <InlineStack gap="400" blockAlign="center">
                        <Text as="span" tone="subdued">
                          Royalty Price
                        </Text>
                        <Text as="span" fontWeight="bold" variant="headingMd">
                          {tx.currency} {tx.price.usd.toFixed(2)}{" "}
                          {/* {tx.price.storeCurrency === "INR" && (
                            <>
                              ({tx.price.storeprice.toFixed(2)}{" "}
                              {tx.price.storeCurrency})
                            </>
                          )} */}
                        </Text>
                      </InlineStack>

                      {tx.description && (
                        <Text as="span" tone="subdued">
                          {tx.description}
                        </Text>
                      )}
                    </BlockStack>
                  </Box>
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
