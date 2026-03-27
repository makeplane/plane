/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import type { ISubTaskCategory, ISubTaskCategoryCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceTaskCategory } from "@/hooks/store";

type FormValues = {
  name: string;
  main_category: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editCategory?: ISubTaskCategory | null;
  defaultMainId?: string | null;
};

export const SubCategoryFormModal = observer(function SubCategoryFormModal({
  open,
  onClose,
  editCategory,
  defaultMainId,
}: Props) {
  const { mainCategoryIds, mainCategories, createSubCategory, updateSubCategory } = useInstanceTaskCategory();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", main_category: defaultMainId ?? "", sort_order: 0, is_active: true },
  });

  useEffect(() => {
    if (editCategory) {
      reset({
        name: editCategory.name,
        main_category: editCategory.main_category ?? "",
        sort_order: editCategory.sort_order,
        is_active: editCategory.is_active,
      });
    } else {
      reset({ name: "", main_category: defaultMainId ?? "", sort_order: 0, is_active: true });
    }
  }, [editCategory, defaultMainId, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: ISubTaskCategoryCreate = {
        name: data.name,
        main_category: data.main_category || null,
        sort_order: Number(data.sort_order),
        is_active: data.is_active,
      };
      if (editCategory) {
        await updateSubCategory(editCategory.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Sub category updated" });
      } else {
        await createSubCategory(payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Sub category created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save sub category" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editCategory ? "Edit Sub Category" : "Add Sub Category"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="sc-name" className="text-13 font-medium">
                Name *
              </label>
              <Input id="sc-name" {...register("name", { required: "Required" })} placeholder="Sub category name" />
              {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="sc-main-category" className="text-13 font-medium">
                Main Category *
              </label>
              <select
                id="sc-main-category"
                {...register("main_category", { required: "Required" })}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
              >
                <option value="">— Select main category —</option>
                {mainCategoryIds.map((id) => (
                  <option key={id} value={id}>
                    {mainCategories[id]?.name}
                  </option>
                ))}
              </select>
              {errors.main_category && (
                <p className="text-11 text-danger-primary">{errors.main_category.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="sc-sort-order" className="text-13 font-medium">
                  Sort order
                </label>
                <Input id="sc-sort-order" type="number" {...register("sort_order")} placeholder="0" />
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
