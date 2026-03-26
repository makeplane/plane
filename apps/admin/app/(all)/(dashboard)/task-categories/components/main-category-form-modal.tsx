/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import type { IMainTaskCategory, IMainTaskCategoryCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceTaskCategory } from "@/hooks/store";

type FormValues = {
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editCategory?: IMainTaskCategory | null;
};

export const MainCategoryFormModal = observer(function MainCategoryFormModal({ open, onClose, editCategory }: Props) {
  const { createMainCategory, updateMainCategory } = useInstanceTaskCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", description: "", sort_order: 0, is_active: true },
  });

  useEffect(() => {
    if (editCategory) {
      reset({
        name: editCategory.name,
        description: editCategory.description,
        sort_order: editCategory.sort_order,
        is_active: editCategory.is_active,
      });
    } else {
      reset({ name: "", description: "", sort_order: 0, is_active: true });
    }
  }, [editCategory, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IMainTaskCategoryCreate = {
        name: data.name,
        description: data.description,
        sort_order: Number(data.sort_order),
        is_active: data.is_active,
      };
      if (editCategory) {
        await updateMainCategory(editCategory.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Main category updated" });
      } else {
        await createMainCategory(payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Main category created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save main category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editCategory ? "Edit Main Category" : "Add Main Category"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="name" className="text-13 font-medium">
                Name *
              </label>
              <Input id="name" {...register("name", { required: "Required" })} placeholder="Category name" />
              {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="description" className="text-13 font-medium">
                Description
              </label>
              <Input id="description" {...register("description")} placeholder="Optional description" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="sort_order" className="text-13 font-medium">
                  Sort order
                </label>
                <Input id="sort_order" type="number" {...register("sort_order")} placeholder="0" />
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
                {editCategory ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
