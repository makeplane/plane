/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import { Copy } from "lucide-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { copyTextToClipboard } from "@plane/utils";

type TCopyableFieldProps = {
  label: string;
  value: string;
  description?: ReactNode;
};

export function CopyableField({ label, value, description }: TCopyableFieldProps) {
  const handleCopy = async () => {
    try {
      await copyTextToClipboard(value);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied!",
        message: `${label} copied to clipboard.`,
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to copy to clipboard.",
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-sm-medium text-primary">{label}</label>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className="relative w-full text-left px-3 py-2 pr-11 bg-layer-2 hover:bg-layer-2-hover border border-subtle-1 rounded-lg transition-colors cursor-pointer group"
      >
        <code className="text-body-xs-regular text-primary break-all">{value}</code>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Copy className="size-4 text-secondary" />
        </div>
      </button>
      {description && <p className="text-body-xs-regular text-tertiary">{description}</p>}
    </div>
  );
}
