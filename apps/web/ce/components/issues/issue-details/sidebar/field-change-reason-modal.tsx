/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type TFieldChangeReasonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  /** Human-readable field label, e.g. "due date" or "completed date" */
  fieldLabel: string;
};

export function FieldChangeReasonModal({ isOpen, onClose, onConfirm, fieldLabel }: TFieldChangeReasonModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset reason input whenever the modal opens/closes
  useEffect(() => {
    if (!isOpen) setReason("");
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4" data-prevent-outside-click>
        <h2 className="text-base font-semibold text-custom-text-100">
          {t("issue.reason_modal_title", { field: fieldLabel })}
        </h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="field-change-reason" className="text-xs font-medium text-custom-text-300">
            {t("issue.reason_label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="field-change-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t("issue.reason_placeholder")}
            className="rounded-md border-[0.5px] border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none resize-none"
            required
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="neutral-primary" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} disabled={!reason.trim()}>
            {t("confirm")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
