/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import type { IJobPosition, IJobPositionCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceJobPosition } from "@/hooks/store";

type FormValues = { name: string; job_grade: string; sort_order: number; is_active: boolean };
type Props = { open: boolean; onClose: () => void; editPosition?: IJobPosition | null; defaultGradeId?: string | null };

export const JobPositionFormModal = observer(function JobPositionFormModal({
  open,
  onClose,
  editPosition,
  defaultGradeId,
}: Props) {
  const { gradeIds, grades, createPosition, updatePosition } = useInstanceJobPosition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", job_grade: defaultGradeId ?? "", sort_order: 0, is_active: true },
  });

  useEffect(() => {
    if (editPosition) {
      reset({
        name: editPosition.name,
        job_grade: editPosition.job_grade ?? "",
        sort_order: editPosition.sort_order,
        is_active: editPosition.is_active,
      });
    } else {
      reset({ name: "", job_grade: defaultGradeId ?? "", sort_order: 0, is_active: true });
    }
  }, [editPosition, defaultGradeId, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IJobPositionCreate = {
        name: data.name,
        job_grade: data.job_grade,
        sort_order: Number(data.sort_order),
        is_active: data.is_active,
      };
      if (editPosition) {
        await updatePosition(editPosition.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Job position updated" });
      } else {
        await createPosition(payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Job position created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save job position" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editPosition ? "Edit Job Position" : "Add Job Position"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="jp-name" className="text-13 font-medium">
                Name *
              </label>
              <Input id="jp-name" {...register("name", { required: "Required" })} placeholder="Position name" />
              {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="jp-grade" className="text-13 font-medium">
                Job Grade *
              </label>
              <select
                id="jp-grade"
                {...register("job_grade", { required: "Required" })}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
              >
                <option value="">— Select job grade —</option>
                {gradeIds.map((id) => (
                  <option key={id} value={id}>
                    {grades[id]?.name}
                  </option>
                ))}
              </select>
              {errors.job_grade && <p className="text-11 text-danger-primary">{errors.job_grade.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="jp-sort-order" className="text-13 font-medium">
                  Sort order
                </label>
                <Input id="jp-sort-order" type="number" {...register("sort_order")} placeholder="0" />
              </div>
              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-13 font-medium cursor-pointer">
                  <input type="checkbox" {...register("is_active")} className="rounded" />
                  Active
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                {editPosition ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
