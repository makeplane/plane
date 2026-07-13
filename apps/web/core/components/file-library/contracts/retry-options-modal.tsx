/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Shared "what should we retry?" dialog, used by the contract peek panel and
 * the bulk-actions bar. Retrying only the failed stage (e.g. AI analysis when
 * the text extraction already succeeded) avoids re-spending extraction and
 * embedding resources.
 */

import { useState } from "react";
import { Check, Loader2, RefreshCcw } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TContractRetryOptions } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { RETRY_OPTIONS } from "./constants";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Empty object = full retry (backend convention) */
  onConfirm: (options: TContractRetryOptions) => Promise<void> | void;
  /** How many contracts this retry applies to (bulk) — 1 for the peek panel */
  count?: number;
};

export function RetryOptionsModal(props: Props) {
  const { isOpen, onClose, onConfirm, count = 1 } = props;
  const { t } = useTranslation();
  // states
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [selection, setSelection] = useState<TContractRetryOptions>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasPartialSelection = Object.values(selection).some(Boolean);

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(mode === "full" ? {} : selection);
      setMode("full");
      setSelection({});
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setMode("full");
    setSelection({});
    onClose();
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <RefreshCcw className="size-4 text-accent-primary" />
          <h3 className="text-14 font-medium">
            {count > 1
              ? t("file_library.contracts.retry.modal_title_bulk", { count })
              : t("file_library.contracts.retry.modal_title")}
          </h3>
        </div>
        <p className="mt-1 text-12 text-tertiary">{t("file_library.contracts.retry.modal_description")}</p>

        <div className="mt-3 space-y-1">
          {/* Full pipeline */}
          <button
            type="button"
            onClick={() => setMode("full")}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-left",
              mode === "full" ? "border-accent-strong bg-accent-primary/5" : "border-subtle hover:bg-layer-1-hover"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                mode === "full" ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
              )}
            >
              {mode === "full" && <Check className="size-3" />}
            </span>
            <span>
              <span className="block text-13 font-medium">{t("file_library.contracts.retry.full_title")}</span>
              <span className="block text-11 text-tertiary">{t("file_library.contracts.retry.full_description")}</span>
            </span>
          </button>

          {/* Specific stages */}
          <button
            type="button"
            onClick={() => setMode("partial")}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-md border px-3 py-2.5 text-left",
              mode === "partial" ? "border-accent-strong bg-accent-primary/5" : "border-subtle hover:bg-layer-1-hover"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                mode === "partial" ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
              )}
            >
              {mode === "partial" && <Check className="size-3" />}
            </span>
            <span>
              <span className="block text-13 font-medium">{t("file_library.contracts.retry.partial_title")}</span>
              <span className="block text-11 text-tertiary">
                {t("file_library.contracts.retry.partial_description")}
              </span>
            </span>
          </button>

          {mode === "partial" && (
            <div className="ml-6 space-y-0.5 pt-1">
              {RETRY_OPTIONS.map((option) => {
                const isChecked = !!selection[option.key];
                return (
                  <button
                    key={option.key}
                    type="button"
                    className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-13 hover:bg-layer-1-hover"
                    onClick={() => setSelection((prev) => ({ ...prev, [option.key]: !prev[option.key] }))}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
                      )}
                    >
                      {isChecked && <Check className="size-3" />}
                    </span>
                    <span>
                      <span className="block">{t(option.i18nKey)}</span>
                      {option.hintKey && (
                        <span className="block text-11 text-tertiary">{t(option.hintKey)}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting || (mode === "partial" && !hasPartialSelection)}
          >
            {isSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : t("file_library.contracts.retry.confirm")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
