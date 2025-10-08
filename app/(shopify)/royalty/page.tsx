"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Page,
  Text,
  Thumbnail,
  Badge,
  Button,
  Tooltip,
  Frame,
  Toast,
  InlineStack,
} from "@shopify/polaris";
import {
  EditIcon,
  ToggleOffIcon,
  ToggleOnIcon,
  ViewIcon,
} from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";
import EditRoyaltyModal from "../../components/editroyality";
import DeleteConfirmationModal from "../../components/dialog";
import Pagination from "../../components/Pagination";
import CustomDataTable from "../../components/CustomDataTable";
import { defaultImage } from "@/lib/config/royaltyConfig";
import moment from "moment";

export default function RoyaltiesPage() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState<string | null>(null);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const limit = 8;
  const [totalPages, setTotalPages] = useState(1);

  const [activeEdit, setActiveEdit] = useState<Royalty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Royalty | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const showToast = (message: string, error: boolean = false) => {
    setToastMessage(message);
    setToastError(error);
  };

  useEffect(() => {
    const shopFromConfig = app?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info. Please reload the app.");
  }, [app]);

  const fetchRoyalties = useCallback(
    async (pageNumber: number = 1) => {
      if (!shop) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/royality?shop=${shop}&page=${pageNumber}&limit=${limit}`,
        );
        if (!res.ok) throw new Error("Failed to fetch royalties");

        const data: ApiResponse = await res.json();
        setRoyalties(data.royalties || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Something went wrong",
          true,
        );
      } finally {
        setLoading(false);
      }
    },
    [shop, limit],
  );

  useEffect(() => {
    if (shop) fetchRoyalties(page);
  }, [shop, page, fetchRoyalties]);

  const handleToggleArchive = async (royalty: Royalty, newState: boolean) => {
    if (!shop) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(
        `/api/royality/product/${royalty.shopifyId}/toggle?shop=${shop}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inArchive: newState }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update royalty status");
      }

      await fetchRoyalties(page);
      showToast(
        newState
          ? "Royalty archived (Switch Off)"
          : "Royalty reactivated (Switch On)",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        true,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdate = async (
    shopifyId: string,
    updates: { Royality?: number; expiry?: string },
  ) => {
    if (!shop || !shopifyId) return;
    try {
      const res = await fetch(
        `/api/royality/product/${shopifyId}/edit?shop=${shop}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update royalty");
      }

      await fetchRoyalties(page);
      setActiveEdit(null);
      showToast("Royalty updated successfully");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Something went wrong",
        true,
      );
    }
  };

  // ✅ Build DataTable rows
  const rows = royalties.map((royalty) => {
    const expiryDate = royalty.expiry ? new Date(royalty.expiry) : null;
    const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false;
    // const expiryDisplay = expiryDate
    //   ? `${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()}${isExpired ? " (Expired)" : ""}`
    //   : "—";

    return [
      <InlineStack key={`product-${royalty.id}`} gap="200" blockAlign="center">
        <Thumbnail source={royalty.image || defaultImage} alt={royalty.title} />
        <div
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 200,
          }}
          title={royalty.title}
        >
          {royalty.title}
        </div>
      </InlineStack>,

      <Text as="h2" fontWeight="medium" alignment="center" key={`royalty-${royalty.id}`}>
        {`${royalty.Royality ?? 0}%`}
      </Text>,
      <Text
        key={`price-${royalty.id}`}
        as="h2"
        alignment="center"
        fontWeight="bold"
      >
        {royalty.price
          ? `${royalty.price.currency} ${royalty.price.amount.toFixed(2)} `
          : "—"}
      </Text>,

      <Text key={`expiry-${royalty.id}`} as="h2" fontWeight="bold">
        {/* Expiry date always in success */}

        <Text as="span" tone="success">
          {expiryDate ? moment(expiryDate).format("lll") : "—"}
        </Text>

        {/* If expired, show (Expired) in red */}
        {isExpired && (
          <>
            <br />
            <Text as="span" tone="critical">
              (Expired)
            </Text>
          </>
        )}
      </Text>,

      <InlineStack key={`actions-${royalty.id}`} align="center" gap="400">
        <Tooltip content="Edit Royalty">
          <Button
            size="slim"
            icon={EditIcon}
            onClick={() => setActiveEdit(royalty)}
          />
        </Tooltip>

        <Tooltip content={royalty.inArchive ? "Switch Off" : "Switch On"}>
          <Button
            size="slim"
            tone={royalty.inArchive ? "critical" : "success"}
            icon={royalty.inArchive ? ToggleOffIcon : ToggleOnIcon}
            onClick={() => setDeleteTarget(royalty)}
          >
            {royalty.inArchive ? "Off" : "On"}
          </Button>
        </Tooltip>

        <Tooltip content="View Product in Shopify Admin">
          <Button
            size="slim"
            icon={ViewIcon}
            onClick={() => {
              if (!shop) return;
              const storeHandle = shop.replace(".myshopify.com", "");
              const shopifyAdminUrl = `https://admin.shopify.com/store/${storeHandle}/products/${royalty.shopifyId}`;
              window.open(shopifyAdminUrl, "_blank");
            }}
          />
        </Tooltip>
      </InlineStack>,
    ];
  });

  return (
    <Frame>
      <Page
        title="Product Royalties"
        subtitle="Assign royalties to your Products"
        fullWidth
        backAction={{ content: "Back", onAction: () => router.back() }}
        primaryAction={{
          content: "Create Royalty Products",
          onAction: () => router.push("/royalty/create"),
        }}
      >
        <CustomDataTable
          columns={[
            "Product",
            "Royalty %",
            "Price",
            "Product Expiry",
            "Actions",
          ]}
          rows={rows}
          loading={loading}
          error={error}
          emptyStateMessage="No royalties products assigned yet"
        />

        {activeEdit && (
          <EditRoyaltyModal
            open={true}
            royalty={activeEdit}
            onClose={() => setActiveEdit(null)}
            onUpdate={handleUpdate}
          />
        )}

        <DeleteConfirmationModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget) {
              await handleToggleArchive(deleteTarget, !deleteTarget.inArchive);
              setDeleteTarget(null);
            }
          }}
          loading={deleteLoading}
          title={
            deleteTarget?.inArchive
              ? "Currently Product is Disable"
              : "Currently Product is Enable"
          }
          message={`Are you sure you want to ${
            deleteTarget?.inArchive ? "Switch On" : "Switch Off"
          } "${deleteTarget?.title}"?`}
          confirmText="Confirm"
          cancelText="Cancel"
          actionType={deleteTarget?.inArchive ? "switchOn" : "switchOff"}
        />

        {toastMessage && (
          <Toast
            content={toastMessage}
            error={toastError}
            onDismiss={() => setToastMessage(null)}
          />
        )}

        {!loading && !error && royalties.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((prev) => Math.max(prev - 1, 1))}
            onNext={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          />
        )}
      </Page>
    </Frame>
  );
}
