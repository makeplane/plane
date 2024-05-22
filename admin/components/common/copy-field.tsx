"use client";

import React from "react";
// ui
import { Copy } from "lucide-react";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// icons

type Props = {
  label: string;
  url: string;
  description: string | JSX.Element;
};

export type TCopyField = {
  key: string;
  label: string;
  url: string;
  description: string | JSX.Element;
};

export const CopyField: React.FC<Props> = (props) => {
  const { label, url, description } = props;

  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm text-custom-text-300">{label}</h4>
      <Button
        variant="neutral-primary"
        className="flex items-center justify-between py-2"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setToast({
            type: TOAST_TYPE.INFO,
            title: "Copied to clipboard",
            message: `The ${label} has been successfully copied to your clipboard`,
          });
        }}
      >
        <p className="text-sm font-medium">{url}</p>
        <Copy size={18} color="#B9B9B9" />
      </Button>
      <div className="text-xs text-custom-text-400">{description}</div>
    </div>
  );
};
