"use client";

import { useState } from "react";

import { Button, Modal, Toast, ToastProvider, useToast } from "@/components/ui";

export function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add site"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Add site</Button>
          </>
        }
      >
        <p>
          Modals are built on the native dialog element, so Escape, focus
          trapping and the backdrop come from the platform.
        </p>
      </Modal>
    </>
  );
}

function ToastTrigger() {
  const { push } = useToast();
  return (
    <Button
      variant="secondary"
      onClick={() =>
        push({ tone: "success", title: "Contract issued", description: "IMC-2026-0117 is ready to download." })
      }
    >
      Push a toast
    </Button>
  );
}

export function ToastDemo() {
  return (
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>
  );
}

export function ToastSamples() {
  return (
    <>
      <Toast tone="success" title="Contract issued" description="IMC-2026-0117 is ready to download." />
      <Toast tone="info" title="Hold placed" description="Expires in 48 hours." />
      <Toast tone="danger" title="Upload failed" description="Check your signal and try again." onDismiss={() => {}} />
    </>
  );
}
