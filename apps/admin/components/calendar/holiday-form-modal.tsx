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
import type { IHoliday } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

type FormValues = { date: string; name: string };

type Props = {
  scheduleId: string;
  open: boolean;
  onClose: () => void;
  editHoliday?: IHoliday | null;
  /** Pre-fill date when creating from calendar cell click */
  defaultDate?: string;
};

export const HolidayFormModal = observer(function HolidayFormModal({
  scheduleId,
  open,
  onClose,
  editHoliday,
  defaultDate,
}: Props) {
  const { createHoliday, updateHoliday } = useBusinessCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { date: "", name: "" },
  });

  useEffect(() => {
    if (editHoliday) {
      reset({ date: editHoliday.date, name: editHoliday.name });
    } else {
      reset({ date: defaultDate ?? "", name: "" });
    }
  }, [editHoliday, defaultDate, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editHoliday) {
        await updateHoliday(scheduleId, editHoliday.id, data);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Cập nhật ngày lễ thành công" });
      } else {
        await createHoliday(scheduleId, data);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Thêm ngày lễ thành công" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Không thể lưu ngày lễ" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.SM}>
        <div className="p-6 space-y-4">
          <Dialog.Title>{editHoliday ? "Sửa ngày lễ" : "Thêm ngày lễ"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="holiday-date" className="text-body-xs-medium text-secondary">
                Ngày (YYYY-MM-DD) *
              </label>
              <Input
                id="holiday-date"
                {...register("date", {
                  required: "Bắt buộc",
                  pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: "Định dạng YYYY-MM-DD" },
                })}
                placeholder="2025-04-30"
              />
              {errors.date && <p className="text-caption-sm-regular text-danger-primary">{errors.date.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="holiday-name" className="text-body-xs-medium text-secondary">
                Tên ngày lễ *
              </label>
              <Input
                id="holiday-name"
                {...register("name", { required: "Bắt buộc" })}
                placeholder="VD: Ngày Giải phóng miền Nam"
              />
              {errors.name && <p className="text-caption-sm-regular text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                Huỷ
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editHoliday ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
