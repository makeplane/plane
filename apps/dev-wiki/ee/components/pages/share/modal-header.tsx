"use client";

import { Link2 } from "lucide-react";
import { Button } from "@plane/ui";

type TModalHeaderProps = {
  pageTitle: string;
  copied: boolean;
  onCopyLink: () => void;
};

export const ModalHeader = ({ pageTitle, copied, onCopyLink }: TModalHeaderProps) => (
  <div className="flex items-center justify-between pt-3 px-4">
    <h3 className="text-lg font-medium text-custom-text-100 truncate">Share {pageTitle}</h3>
    <Button
      variant="link-primary"
      size="sm"
      prependIcon={<Link2 className="size-3.5 -rotate-45" />}
      onClick={onCopyLink}
      className="shrink-0"
    >
      {copied ? "Copied!" : "Copy link"}
    </Button>
  </div>
);

ModalHeader.displayName = "ModalHeader";

