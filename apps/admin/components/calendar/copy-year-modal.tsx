/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ICopyYearResponse } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

type FormValues = { from_year: string; to_year: string };

type Props = {
  scheduleId: string;
  open: boolean;
  onClose: () => void;
  currentYear: number;
};

export const CopyYearModal = observer(function CopyYearModal({ scheduleId, open, onClose, currentYear }: Props) {
  const { copyYear } = useBusinessCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ICopyYearResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { from_year: String(currentYear), to_year: String(currentYear + 1) },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await copyYear(scheduleId, Number(data.from_year), Number(data.to_year));
      setResult(res);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Đã sao chép: ${res.copied_holidays} ngày lễ, ${res.copied_overrides} override`,
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Không thể sao chép năm" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6 space-y-4">
          <Dialog.Title>Sao chép năm lịch</Dialog.Title>

          {result ? (
            <div className="space-y-4">
              {/* Prominent lunar holiday warning */}
              <div className="flex gap-3 p-4 rounded-lg bg-warning-subtle border border-warning-strong">
                <AlertTriangle className="w-5 h-5 text-warning-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-body-sm-semibold text-warning-primary">
                    ⚠️ Tết và Giỗ Tổ là ngày âm — vui lòng xác minh và chỉnh sửa thủ công
                  </p>
                  <p className="text-caption-sm-regular text-secondary">
                    Các ngày lễ theo lịch âm thay đổi mỗi năm. Dữ liệu đã sao chép cần được kiểm tra lại.
                  </p>
                </div>
              </div>

              <div className="text-body-sm-regular text-secondary space-y-1">
                <p>
                  Đã sao chép <strong>{result.copied_holidays}</strong> ngày lễ và{" "}
                  <strong>{result.copied_overrides}</strong> override.
                </p>
                {result.skipped > 0 && <p className="text-warning-primary">Bỏ qua {result.skipped} mục trùng lặp.</p>}
              </div>

              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-body-xs-semibold text-secondary">Cảnh báo chi tiết:</p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="text-caption-sm-regular text-warning-primary flex gap-1.5">
                        <span className="shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleClose}>
                  Đóng
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
              <p className="text-body-sm-regular text-secondary">
                Sao chép tất cả ngày lễ và override từ một năm sang năm khác.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="from-year" className="text-body-xs-medium text-secondary">
                    Năm nguồn *
                  </label>
                  <Input
                    id="from-year"
                    {...register("from_year", {
                      required: "Bắt buộc",
                      pattern: { value: /^\d{4}$/, message: "Nhập năm 4 chữ số" },
                    })}
                    placeholder="2025"
                  />
                  {errors.from_year && (
                    <p className="text-caption-sm-regular text-danger-primary">{errors.from_year.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="to-year" className="text-body-xs-medium text-secondary">
                    Năm đích *
                  </label>
                  <Input
                    id="to-year"
                    {...register("to_year", {
                      required: "Bắt buộc",
                      pattern: { value: /^\d{4}$/, message: "Nhập năm 4 chữ số" },
                    })}
                    placeholder="2026"
                  />
                  {errors.to_year && (
                    <p className="text-caption-sm-regular text-danger-primary">{errors.to_year.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={handleClose}>
                  Huỷ
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang sao chép..." : "Sao chép"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
