# Phase 03: Frontend – FieldChangeReasonModal Component

## Overview
Tạo modal đơn giản để user nhập lý do trước khi thay đổi `target_date` hoặc `completed_at`. Reuse styling pattern từ `worklog-modal.tsx`.

## File to CREATE

### `apps/web/ce/components/issues/issue-details/field-change-reason-modal.tsx`

```tsx
import type { FormEvent } from "react";
import { useState, useEffect } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";

type TFieldChangeReasonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  fieldLabel: string; // e.g. "due date" or "completed date"
};

export function FieldChangeReasonModal({ isOpen, onClose, onConfirm, fieldLabel }: TFieldChangeReasonModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open/close
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
      <form onSubmit={handleSubmit} className="p-5 space-y-4" data-prevent-outside-click>
        <h2 className="text-16 font-semibold text-primary">
          {t("issue.reason_modal_title", { field: fieldLabel })}
        </h2>
        <div className="flex flex-col gap-1">
          <label htmlFor="field-change-reason" className="text-11 font-medium text-tertiary">
            {t("issue.reason_label")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="field-change-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder={t("issue.reason_placeholder")}
            className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary placeholder-tertiary focus:outline-none resize-none"
            required
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="tertiary" size="sm" onClick={onClose} type="button" disabled={isSubmitting}>
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
```

## Key Design Decisions
- Không dùng `observer` vì không cần MobX state — chỉ là local form state
- `autoFocus` trên textarea để UX smooth
- `disabled={!reason.trim()}` để prevent submit khi empty (cả UI lẫn validation)
- `onClose()` sau khi `onConfirm` thành công — caller không cần tự close
- Nếu `onConfirm` throw error → modal ở lại (user có thể thử lại)

## Export
Thêm vào `apps/web/ce/components/issues/issue-details/index.ts` (nếu có) hoặc import trực tiếp từ file path.
