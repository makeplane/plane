/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type TWorklogDeleteModal = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
};

export const WorklogDeleteModal = (props: TWorklogDeleteModal) => {
  const { isOpen, onClose, onConfirm } = props;
  const { t } = useTranslation();

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch {
      // error toast handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.MD}>
      <div className="p-5 space-y-4" data-prevent-outside-click>
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 rounded-full bg-red-500/10 p-1.5">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </span>
          <h2 className="text-16 font-semibold text-primary">{t("worklog.confirm_delete_title")}</h2>
        </div>

        <p className="text-13 text-tertiary">{t("worklog.confirm_delete_message")}</p>

        {/* Reason textarea */}
        <div className="flex flex-col gap-1">
          <label htmlFor="delete-reason" className="text-11 font-medium text-tertiary">
            {t("worklog.delete_reason_label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="delete-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("worklog.delete_reason_placeholder")}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary placeholder-tertiary focus:outline-none resize-none"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="tertiary" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            variant="error-fill"
            size="sm"
            onClick={() => void handleConfirm()}
            loading={isSubmitting}
            disabled={!reason.trim()}
          >
            {t("worklog.confirm_delete")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};
