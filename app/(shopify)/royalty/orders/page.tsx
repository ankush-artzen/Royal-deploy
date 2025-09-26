"use client";

import { useEffect, useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { InlineStack, Page } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import CustomDataTable from "@/app/components/CustomDataTable";
import OrderModal from "@/app/components/RoyaltyOrderModal";
import Pagination from "@/app/components/Pagination";

export default function RoyaltiesPage() {
  const [orders, setOrders] = useState<RoyaltyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RoyaltyOrder | null>(null);
  const [totalRoyalty, setTotalRoyalty] = useState<number>(0);
  const [totalConvertedRoyalty, setTotalConvertedRoyalty] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [modalActive, setModalActive] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const app = useAppBridge();
  const router = useRouter();

  // Detect shop
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info. Please reload the app.");
  }, [app]);

  const storeName = shop?.replace(".myshopify.com", "");

  // Fetch royalty orders
  useEffect(() => {
    if (!shop) return;

    const fetchRoyalties = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/royality/orders?shop=${shop}&page=${page}&limit=${limit}`,
        );
        if (!res.ok) throw new Error("Failed to fetch royalties");
        const data = await res.json();

        setOrders(data.orders || []);
        setTotalRoyalty(data.totalCalculatedRoyalty || 0);
        setTotalConvertedRoyalty(data.totalConvertedRoyalty || 0);
        setTotalOrders(data.totalOrders || 0);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchRoyalties();
  }, [shop, page, limit]);

  const totalPages = Math.ceil(totalOrders / limit);

  const openOrderModal = async (order: RoyaltyOrder) => {
    if (!shop) return;

    setSelectedOrder({ ...order, transactions: [] });
    setModalActive(true);
    setModalLoading(true);

    try {
      const res = await fetch(
        `/api/royality/orders/transaction?shop=${shop}&orderId=${order.orderId}`,
      );
      const data = await res.json();

      if (data.success) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, transactions: data.transactions || [] } : prev,
        );
      }
    } catch (err) {
      console.error("❌ Failed to fetch transactions", err);
    } finally {
      setModalLoading(false);
    }
  };

  // Build rows for table
  // Build rows for table
  const rows: (string | JSX.Element)[][] =
    orders.length > 0
      ? [
          ...orders.map((order) => {
            console.log("Mapping order:", order);
            return [
              <a
                key={`name-${order.orderId}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Clicked orderId:", order.orderId);
                  openOrderModal(order);
                }}
                style={{
                  color: "blue",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {order.orderName}
              </a>,
              <InlineStack key={`id-${order.orderId}`}>
                <div style={{ textAlign: "start", minWidth: "80px" }}>
                  {order.orderId}
                </div>
              </InlineStack>,

              <span key={`royalty1-${order.orderId}`}>
                {order.convertedCurrencyAmountRoyality.toFixed(2)} USD{" "}
                {/* {order.currency === "INR" && (
                  <>
                    ({order.calculatedRoyaltyAmount.toFixed(2)} {order.currency}
                    )
                  </>
                )} */}
              </span>,
              // <span key={`royalty2-${order.orderId}`}>
              //   {order.convertedCurrencyAmountRoyality.toFixed(2)} USD
              // </span>,
              <span key={`date-${order.orderId}`}>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "-"}
              </span>,
            ];
          }),
          // TOTAL row
          [
            <strong key="total-label">TOTAL</strong>,
            "",
            <strong key="total-royalty">
              {totalConvertedRoyalty.toFixed(2)} USD
              {/* {totalCurrency === "INR" && `(${totalRoyalty.toFixed(2)} INR)`} */}
            </strong>,
            "", // empty for "Created At"
          ],

          // `${totalConvertedRoyalty.toFixed(2)} USD`,
        ]
      : [];

  return (
    <Page
      title="Royalties Per Order"
      backAction={{ content: "Back", onAction: () => router.back() }}
    >
      <CustomDataTable
        columns={["Order Name", "Order ID", "Royalty Amount", "Created At"]}
        rows={rows}
        loading={loading}
        error={error}
        emptyStateMessage="No royalty orders found"
      />

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          storeName={storeName || ""}
          active={modalActive}
          onClose={() => setModalActive(false)}
          loading={modalLoading}
        />
      )}

      {!loading && !error && orders.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
          onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
        />
      )}
    </Page>
  );
}
