"use client";

import React from "react";
import { Modal, Text, Button, Box } from "@shopify/polaris";

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = "Delete item?",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  actionType = "switchOff",
}) => {
  return (
    <>
      {/* Inline style override for modal background */}
      <style>
        {`
          .Polaris-Backdrop {
            backdrop-filter: blur(1px);
            -webkit-backdrop-filter: blur(6px);
            background-color: rgba(255, 255, 255, 0.01);
          }
        `}
      </style>

      <Modal
        open={open}
        onClose={onClose}
        title={title}
        footer={
          <Box padding="400" paddingBlockStart="400">
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <Button onClick={onClose}>{cancelText}</Button>
              <Button
                tone={actionType === "switchOn" ? "success" : "critical"}
                variant="secondary"
                loading={loading}
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </Box>
        }
      >
        <Modal.Section>
          <Text as="p">{message}</Text>
        </Modal.Section>
      </Modal>
    </>
  );
};

export default DeleteConfirmationModal;
