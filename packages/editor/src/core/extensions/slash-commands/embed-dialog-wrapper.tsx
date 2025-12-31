"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertModalCore } from "@plane/ui";
import { validateUrl } from "@/helpers/urls";
import EmbedInput from "./embed";

export function EmbedDialog() {
  const [editor, setEditor] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [showInvalidUrlAlert, setShowInvalidUrlAlert] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      setEditor(e.detail.editor);
      setOpen(true);
    };

    window.addEventListener("open-embed-dialog", handler);
    return () => window.removeEventListener("open-embed-dialog", handler);
  }, []);

  if (!open || !editor) return null;

  const insertFallbackLink = (url: string) => {
    editor.chain().focus().setLink({ href: url }).insertContent(url).unsetLink().run();
  };

  const handleEmbed = async (rawUrl: string) => {
    const url = validateUrl(rawUrl);

    if (!url) {
      setShowInvalidUrlAlert(true);
      return;
    }

    try {
      const res = await fetch("/api/link-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!data?.error) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "linkEmbed",
            attrs: {
              url,
              title: data.title ?? url,
              description: data.description ?? "",
              image: data.image ?? null,
              favicon: data.favicon ?? null,
            },
          })
          .run();
      } else {
        insertFallbackLink(url);
      }
    } catch {
      insertFallbackLink(url);
    }

    close();
  };

  const close = () => {
    setOpen(false);
    setEditor(null);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24">
        <EmbedInput onEmbed={handleEmbed} onCancel={close} />
      </div>
      <AlertModalCore
        isOpen={showInvalidUrlAlert}
        title="Invalid URL"
        content={<p>Your URL is not valid. Please enter a valid URL.</p>}
        handleClose={() => setShowInvalidUrlAlert(false)}
        handleSubmit={() => setShowInvalidUrlAlert(false)}
        isSubmitting={false}
        variant="danger"
      />
    </>,
    document.body
  );
}
