/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

// Static contact info — update values as needed
const CONTACT_INFO = {
  fullName: "",
  email: "",
  phone: "",
} as const;

type CopiedField = "fullName" | "email" | "phone" | null;

type Props = { isOpen: boolean; handleClose: () => void };

export const ContactPointModal = observer(function ContactPointModal({ isOpen, handleClose }: Props) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<CopiedField>(null);

  const handleCopy = (field: keyof typeof CONTACT_INFO, key: CopiedField) => {
    navigator.clipboard.writeText(CONTACT_INFO[field]);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const rows: { key: keyof typeof CONTACT_INFO; label: string; value: string }[] = [
    { key: "fullName", label: t("contact_point_full_name"), value: CONTACT_INFO.fullName },
    { key: "email", label: t("contact_point_email"), value: CONTACT_INFO.email },
    { key: "phone", label: t("contact_point_phone"), value: CONTACT_INFO.phone },
  ];

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-6">
        <h3 className="text-base font-semibold text-color-primary mb-4">{t("contact_point")}</h3>
        <div className="space-y-3">
          {rows.map(({ key, label, value }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border border-color-subtle bg-surface-1 px-3 py-2"
            >
              <div>
                <p className="text-xs text-color-secondary">{label}</p>
                <p className="text-sm text-color-primary">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(key, key)}
                className="ml-3 rounded p-1 text-color-secondary hover:bg-layer-1 hover:text-color-primary transition-colors"
                title={copiedField === key ? t("contact_point_copied") : t("contact_point_copy")}
              >
                {copiedField === key ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </ModalCore>
  );
});
