"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Form,
  FormLayout,
  TextField,
  Button,
  Thumbnail,
  InlineStack,
  BlockStack,
  Text,
  Toast,
  Frame,
  Divider,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";

export default function AssignRoyalty() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState<string | null>(null);
  const [billingActive, setBillingActive] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedDesigner, setSelectedDesigner] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    title: string;
    image?: string;
    price?: string | number;
  } | null>(null);
  const [royalty, setRoyalty] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [toastError, setToastError] = useState(false);

  const dismissToast = () => setToastActive(false);
  const showToast = (msg: string, isError = false) => {
    console.log("🔔 Toast:", msg, "Error?", isError);
    setToastContent(msg);
    setToastError(isError);
    setToastActive(true);
  };

  // ✅ Step 1: Fetch shop info from App Bridge
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    console.log("🛍️ Shop from App Bridge config:", shopFromConfig);
    if (shopFromConfig) {
      setShop(shopFromConfig);
    } else {
      setError("Unable to retrieve shop info. Please reload the app.");
    }
  }, [app]);

  // Fetch billing status once shop is available
  useEffect(() => {
    if (!shop) return;
    console.log("📡 Fetching billing status for shop:", shop);

    fetch(`/api/charges/status?shop=${shop}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("💳 Billing status response:", data);
        setBillingActive(data.active);
      })
      .catch((err) => {
        console.error("❌ Billing status fetch failed:", err);
        setBillingActive(false);
        showToast("Failed to fetch billing status", true);
      });
  }, [shop]);

  // ✅ Handle Royalty Assignment
  const handleSubmit = async () => {
    if (!selectedDesigner || !selectedProduct || !royalty) {
      showToast("All fields are required", true);
      return;
    }

    const numericRoyalty = parseFloat(royalty);
    if (isNaN(numericRoyalty) || numericRoyalty < 0 || numericRoyalty > 100) {
      showToast("Royalty must be between 0 and 100", true);
      return;
    }

    const payload = {
      designerId: selectedDesigner,
      productId: selectedProduct.id,
      title: selectedProduct.title,
      image: selectedProduct.image || null,
      royality: numericRoyalty,
      price: selectedProduct.price || 0,
      shopifyId: selectedProduct.id,
      currency: "",
      storeCurrency: ""
    };

    console.log("📦 Payload before submit:", payload);

    setLoading(true);
    try {
      const res = await fetch(`/api/royality/product/create?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("✅ API response:", data);

      if (res.ok) {
        showToast("Royalty assigned successfully!");
        setSelectedProduct(null);
        setSelectedDesigner("");
        setRoyalty("");
        router.push("/royalty");
      } else {
        showToast(data.error || "Failed to assign royalty", true);
      }
    } catch (err: any) {
      console.error("❌ API request failed:", err);
      showToast(err.message || "Network error", true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Product Picker
  const selectProducts = async () => {
    if (!billingActive) {
      showToast("Please enable billing before selecting products", true);
      return;
    }

    console.log("📦 Opening product picker…");
    const pickerResult = await (app as any).resourcePicker({
      type: "product",
      multiple: false,
    });

    console.log("📦 Picker result:", pickerResult);

    const product = pickerResult?.selection?.[0];
    if (product) {
      const parsed = {
        id: product.id.split("/").pop(),
        title: product.title,
        image: product.images?.[0]?.originalSrc || "",
        price: product.variants?.[0]?.price || 0,
      };
      console.log("✅ Selected product:", parsed);
      setSelectedProduct(parsed);
    } else {
      showToast("No product selected", true);
    }
  };

  // ✅ Centered loader while fetching shop or billing
  if (!shop || billingActive === null) {
    console.log("⏳ Waiting for shop or billing status…", { shop, billingActive });
    return (
      <Frame>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spinner size="large" accessibilityLabel="Loading..." />
        </div>
      </Frame>
    );
  }

  if (error) {
    console.error("❌ Error:", error);
    return (
      <Frame>
        <Banner title="Error" tone="critical">
          <p>{error}</p>
        </Banner>
      </Frame>
    );
  }

  return (
    <Frame>
      {toastActive && (
        <Toast
          content={toastContent}
          error={toastError}
          onDismiss={dismissToast}
        />
      )}

      <Page
        title="Assign Royalty"
        backAction={{ content: "Back", onAction: () => router.back() }}
        primaryAction={{
          content: "Save",
          onAction: handleSubmit,
          loading,
          disabled: loading || !billingActive,
        }}
      >
        {billingActive === false && (
          <Banner title="Enable billing to assign royalties" tone="critical">
            <p>
              You need an active subscription before assigning royalties to
              products. Please enable billing in your Shopify admin first.
            </p>
          </Banner>
        )}

        <Form onSubmit={handleSubmit}>
          <BlockStack gap="600">
            {/* Product Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product
                </Text>
                <Text as="p" tone="subdued">
                  Choose the product you want to assign a royalty to.
                </Text>
                <Button onClick={selectProducts} disabled={!billingActive}>
                  {selectedProduct ? "Change Product" : "Choose Product"}
                </Button>

                {selectedProduct && (
                  <Card roundedAbove="sm">
                    <InlineStack gap="300" blockAlign="center">
                      <Thumbnail
                        size="large"
                        source={selectedProduct.image || ""}
                        alt={selectedProduct.title}
                      />
                      <BlockStack>
                        <Text as="h3" variant="bodyMd" fontWeight="bold">
                          {selectedProduct.title}
                        </Text>
                        <Text as="p" tone="subdued">
                          {selectedProduct.price}
                        </Text>
                      </BlockStack>
                      <Button onClick={() => setSelectedProduct(null)}>
                        Remove
                      </Button>
                    </InlineStack>
                  </Card>
                )}
              </BlockStack>
            </Card>

            {/* Designer + Royalty Section */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Royalty Details
                </Text>
                <Divider />
                <FormLayout>
                  <TextField
                    label="Designer ID"
                    value={selectedDesigner}
                    onChange={setSelectedDesigner}
                    placeholder="Enter designer ID"
                    autoComplete="off"
                    disabled={!billingActive}
                  />

                  <TextField
                    label="Royalty Percentage"
                    type="number"
                    value={royalty}
                    onChange={setRoyalty}
                    min={0}
                    max={100}
                    suffix="%"
                    autoComplete="off"
                    disabled={!billingActive}
                  />
                </FormLayout>
              </BlockStack>
            </Card>
          </BlockStack>
        </Form>
      </Page>
    </Frame>
  );
}
