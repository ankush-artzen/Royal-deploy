"use client";

import { Modal, TextField } from "@shopify/polaris";
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
}

interface EditRoyaltyModalProps {
  open: boolean;
  royalty: Royalty | null;
  onClose: () => void;
  onUpdate: (id: string, newRoyality: number) => void;
}

export default function EditRoyaltyModal({
  open,
  royalty,
  onClose,
  onUpdate,
}: EditRoyaltyModalProps) {
  const [newRoyality, setNewRoyality] = useState<number>(0);

  useEffect(() => {
    if (royalty) setNewRoyality(royalty.Royality);
  }, [royalty]);

  if (!royalty) return null;

  const handleUpdate = () => {
    onUpdate(royalty.shopifyId, newRoyality); // ✅ use shopifyId (or productId)
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
        <TextField
          label="Royalty %"
          type="number"
          value={newRoyality.toString()}
          onChange={(value) => setNewRoyality(value === "" ? 0 : Number(value))}
          min={0}
          max={100}
          step={0.01} // optional
          autoComplete="off"
        />
      </Modal.Section>
    </Modal>
  );
}
