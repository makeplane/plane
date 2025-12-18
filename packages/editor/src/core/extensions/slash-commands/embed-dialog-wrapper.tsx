"use client";

import { useEffect, useState } from "react";
import EmbedInput from "./embed";


const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10000,
};

const dialogStyle = {
  width: "100%",
  maxWidth: 520,
};


export function EmbedDialog() {
  const [editor, setEditor] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      setEditor(e.detail.editor);
      setOpen(true);
    };

    window.addEventListener("open-embed-dialog", handler);
    return () =>
      window.removeEventListener("open-embed-dialog", handler);
  }, []);

  if (!open) return null;

  const handleEmbed = (url: string) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "externalEmbed",
        attrs: { url },
      })
      .run();

    close();
  };

  const close = () => {
    setOpen(false);
    setEditor(null);
  };

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <EmbedInput onEmbed={handleEmbed} onCancel={close} />
      </div>
    </div>
  );
}
