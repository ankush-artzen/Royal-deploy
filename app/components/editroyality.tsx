"use client";

import { Modal, TextField, BlockStack } from "@shopify/polaris";
import { useState, useEffect } from "react";

export interface Royalty {
  id: string;
  productId: string;
  shopifyId: string;
  title: string;
  image?: string | null;
  status?: string | null;
  price?: {
    amount: number;
    currency: string;
    storeCurrency: string;
    storeAmount: number;
  } | null;
  designerId: string;
  Royality: number;
  shop?: string | null;
  expiry?: string | null;
}


export default function EditRoyaltyModal({
  open,
  royalty,
  onClose,
  onUpdate,
}: EditRoyaltyModalProps) {
  const [newRoyality, setNewRoyality] = useState<number>(0);
  const [expiry, setExpiry] = useState<string>("");

  useEffect(() => {
    if (royalty) {
      setNewRoyality(royalty.Royality);

      if (royalty.expiry) {
        const dt = new Date(royalty.expiry);
        const tzOffset = dt.getTimezoneOffset() * 60000; 
        const localISOTime = new Date(dt.getTime() - tzOffset)
          .toISOString()
          .slice(0, 16);
        setExpiry(localISOTime);
      } else {
        setExpiry("");
      }
    }
  }, [royalty]);

  if (!royalty) return null;

  const handleUpdate = () => {
    if (newRoyality < 0 || newRoyality > 100) {
      alert("Royalty must be between 0 and 100");
      return;
    }

    onUpdate(royalty.shopifyId, {
      Royality: newRoyality,
      expiry: expiry ? new Date(expiry).toISOString() : undefined,
    });

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Royalty for ${royalty.title}`}
      primaryAction={{ content: "Update", onAction: handleUpdate }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <TextField
            label="Royalty %"
            type="number"
            value={newRoyality.toString()}
            onChange={(value) =>
              setNewRoyality(value === "" ? 0 : Number(value))
            }
            min={0}
            max={100}
            step={0.01}
            autoComplete="off"
          />
          <TextField
            label="Expiry Date & Time"
            type="datetime-local"
            value={expiry}
            onChange={(value) => setExpiry(value)}
            autoComplete="off"
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
