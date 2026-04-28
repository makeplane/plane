/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDayOverride, TDayOverrideType } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

type FormValues = {
  date: string;
  type: TDayOverrideType;
  reason: string;
  swap_with_date: string;
};

type Props = {
  scheduleId: string;
  open: boolean;
  onClose: () => void;
  editOverride?: IDayOverride | null;
  defaultDate?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DayOverrideFormModal = observer(function DayOverrideFormModal({
  scheduleId,
  open,
  onClose,
  editOverride,
  defaultDate,
}: Props) {
  const { createOverride, updateOverride } = useBusinessCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { date: "", type: "WORKDAY", reason: "", swap_with_date: "" },
  });

  const overrideType = watch("type");

  useEffect(() => {
    if (editOverride) {
      reset({
        date: editOverride.date,
        type: editOverride.type,
        reason: editOverride.reason,
        swap_with_date: editOverride.swap_with_date ?? "",
      });
    } else {
      reset({ date: defaultDate ?? "", type: "WORKDAY", reason: "", swap_with_date: "" });
    }
  }, [editOverride, defaultDate, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        date: data.date,
        type: data.type,
        reason: data.reason,
        swap_with_date: data.swap_with_date.trim() || null,
      };
      if (editOverride) {
        await updateOverride(scheduleId, editOverride.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Cập nhật override thành công" });
      } else {
        await createOverride(scheduleId, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Thêm override thành công" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Không thể lưu override" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.SM}>
        <div className="p-6 space-y-4">
          <Dialog.Title>{editOverride ? "Sửa override ngày" : "Thêm override ngày"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="override-date" className="text-body-xs-medium text-secondary">
                Ngày (YYYY-MM-DD) *
              </label>
              <Input
                id="override-date"
                {...register("date", {
                  required: "Bắt buộc",
                  pattern: { value: DATE_PATTERN, message: "Định dạng YYYY-MM-DD" },
                })}
                placeholder="2025-04-26"
              />
              {errors.date && <p className="text-caption-sm-regular text-danger-primary">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <div className="text-body-xs-medium text-secondary">Loại *</div>
              <div className="flex gap-4">
                {(["WORKDAY", "HOLIDAY"] as TDayOverrideType[]).map((t) => (
                  <label key={t} htmlFor={`override-type-${t}`} className="flex items-center gap-2 cursor-pointer">
                    <input
                      id={`override-type-${t}`}
                      type="radio"
                      value={t}
                      {...register("type")}
                      className="accent-accent-primary"
                    />
                    <span className="text-body-sm-regular text-primary">
                      {t === "WORKDAY" ? "Ngày làm việc bù" : "Ngày nghỉ bù"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="override-reason" className="text-body-xs-medium text-secondary">
                Lý do *
              </label>
              <Input
                id="override-reason"
                {...register("reason", { required: "Bắt buộc" })}
                placeholder="VD: Làm bù cho ngày 30/4"
              />
              {errors.reason && <p className="text-caption-sm-regular text-danger-primary">{errors.reason.message}</p>}
            </div>
            {overrideType === "WORKDAY" && (
              <div className="space-y-1">
                <label htmlFor="override-swap" className="text-body-xs-medium text-secondary">
                  Hoán đổi với ngày (tuỳ chọn)
                </label>
                <Input
                  id="override-swap"
                  {...register("swap_with_date", {
                    pattern: { value: /^$|^\d{4}-\d{2}-\d{2}$/, message: "Định dạng YYYY-MM-DD hoặc để trống" },
                  })}
                  placeholder="2025-04-30"
                />
                {errors.swap_with_date && (
                  <p className="text-caption-sm-regular text-danger-primary">{errors.swap_with_date.message}</p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                Huỷ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editOverride ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
