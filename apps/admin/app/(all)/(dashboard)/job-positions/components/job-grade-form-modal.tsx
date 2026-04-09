/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import type { IJobGrade, IJobGradeCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceJobPosition } from "@/hooks/store";

type FormValues = { name: string; description: string; sort_order: number; is_active: boolean };
type Props = { open: boolean; onClose: () => void; editGrade?: IJobGrade | null };

export const JobGradeFormModal = observer(function JobGradeFormModal({ open, onClose, editGrade }: Props) {
  const { createGrade, updateGrade } = useInstanceJobPosition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", description: "", sort_order: 0, is_active: true },
  });

  useEffect(() => {
    if (editGrade) {
      reset({ name: editGrade.name, description: editGrade.description ?? "", sort_order: editGrade.sort_order, is_active: editGrade.is_active });
    } else {
      reset({ name: "", description: "", sort_order: 0, is_active: true });
    }
  }, [editGrade, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IJobGradeCreate = { name: data.name, description: data.description, sort_order: Number(data.sort_order), is_active: data.is_active };
      if (editGrade) {
        await updateGrade(editGrade.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Job grade updated" });
      } else {
        await createGrade(payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Job grade created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save job grade" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editGrade ? "Edit Job Grade" : "Add Job Grade"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="jg-name" className="text-13 font-medium">Name *</label>
              <Input id="jg-name" {...register("name", { required: "Required" })} placeholder="Grade name" />
              {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="jg-description" className="text-13 font-medium">Description</label>
              <Input id="jg-description" {...register("description")} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="jg-sort-order" className="text-13 font-medium">Sort order</label>
                <Input id="jg-sort-order" type="number" {...register("sort_order")} placeholder="0" />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-13 font-medium cursor-pointer">
                  <input type="checkbox" {...register("is_active")} className="rounded" />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                {editGrade ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
