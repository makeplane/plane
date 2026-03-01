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

import { useState } from "react";
import { Button } from "@plane/propel/button";
import { ModalCore, EModalWidth, EModalPosition } from "@plane/ui";
export type TExportProvider = "csv" | "xlsx" | "json";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (provider: TExportProvider) => void | Promise<void>;
  defaultProvider?: TExportProvider;
};

export function ExportModal(props: Props) {
  const { isOpen, onClose, onConfirm, defaultProvider = null } = props;
  const [provider, setProvider] = useState<TExportProvider | null>(defaultProvider);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!provider) return;
    setIsSubmitting(true);
    await onConfirm(provider);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.SM} position={EModalPosition.TOP}>
      <div className="p-5">
        <h3 className="text-14 text-primary font-medium mb-2">Export</h3>
        <div className="space-y-2">
          <p className="font-medium text-13 text-secondary">Format</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="provider" checked={provider === "csv"} onChange={() => setProvider("csv")} />
            <span className="text-11">CSV</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="provider" checked={provider === "json"} onChange={() => setProvider("json")} />
            <span className="text-11">JSON</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-subtle-1 p-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!provider || isSubmitting}>
          Continue
        </Button>
      </div>
    </ModalCore>
  );
}
