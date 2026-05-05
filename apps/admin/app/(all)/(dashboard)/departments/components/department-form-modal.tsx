/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import type { DeptType, IInstanceDepartment, IInstanceDepartmentCreate } from "@plane/services";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useInstanceDepartment } from "@/hooks/store";

type FormValues = {
  name: string;
  code: string;
  short_name: string;
  dept_code: string;
  dept_type: DeptType;
  description: string;
  parent: string;
  level: number;
  manager: string;
  sort_order: number;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  editDept?: IInstanceDepartment | null;
};

const DEPT_TYPE_OPTIONS: DeptType[] = ["HO", "BRX", "OSR"];

export const DepartmentFormModal = observer(function DepartmentFormModal({ open, onClose, editDept }: Props) {
  const { departments, departmentIds, createDepartment, updateDepartment } = useInstanceDepartment();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      code: "",
      short_name: "",
      dept_code: "",
      dept_type: "" as DeptType,
      description: "",
      parent: "",
      level: 0,
      manager: "",
      sort_order: 65535,
      is_active: true,
    },
  });

  const parentId = watch("parent");

  // Auto-calc level from parent
  useEffect(() => {
    if (parentId && departments[parentId]) {
      setValue("level", departments[parentId].level + 1);
    } else {
      setValue("level", 0);
    }
  }, [parentId, departments, setValue]);

  useEffect(() => {
    if (editDept) {
      reset({
        name: editDept.name,
        code: editDept.code ?? "",
        short_name: editDept.short_name ?? "",
        dept_code: editDept.dept_code ?? "",
        dept_type: editDept.dept_type,
        description: editDept.description,
        parent: editDept.parent ?? "",
        level: editDept.level,
        manager: editDept.manager ?? "",
        sort_order: editDept.sort_order,
        is_active: editDept.is_active,
      });
    } else {
      reset({
        name: "",
        code: "",
        short_name: "",
        dept_code: "",
        dept_type: "" as DeptType,
        description: "",
        parent: "",
        level: 0,
        manager: "",
        sort_order: 65535,
        is_active: true,
      });
    }
  }, [editDept, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IInstanceDepartmentCreate = {
        ...data,
        short_name: (data.short_name ?? "").toUpperCase(),
        parent: data.parent || null,
        manager: data.manager || null,
        linked_workspace: editDept?.linked_workspace ?? null,
      };
      if (editDept) {
        await updateDepartment(editDept.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Department updated" });
      } else {
        await createDepartment(payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Department created" });
      }
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save department" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>{editDept ? "Edit Department" : "Add Department"}</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-13 font-medium">Name *</label>
                <Input {...register("name", { required: "Required" })} placeholder="Department name" />
                {errors.name && <p className="text-11 text-danger-primary">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-13 font-medium">Code</label>
                <Input {...register("code")} placeholder="e.g. IT" />
              </div>
              <div className="space-y-1">
                <label className="text-13 font-medium">Short name</label>
                <Input {...register("short_name")} placeholder="Uppercase short name" />
              </div>
              <div className="space-y-1">
                <label className="text-13 font-medium">Dept code (4 digits)</label>
                <Input
                  {...register("dept_code", { pattern: { value: /^\d{4}$/, message: "Must be 4 digits" } })}
                  placeholder="0001"
                />
                {errors.dept_code && <p className="text-11 text-danger-primary">{errors.dept_code.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-13 font-medium">Dept Type</label>
                <select
                  {...register("dept_type")}
                  className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
                >
                  <option value="">— Select type —</option>
                  {DEPT_TYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-13 font-medium">Parent department</label>
              <select
                {...register("parent")}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
              >
                <option value="">— None (top level) —</option>
                {departmentIds
                  .filter((id) => id !== editDept?.id)
                  .map((id) => (
                    <option key={id} value={id}>
                      {departments[id]?.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-13 font-medium">Description</label>
              <Input {...register("description")} placeholder="Optional description" />
            </div>
            <div className="space-y-1">
              <label className="text-13 font-medium">Sort Order</label>
              <Input
                type="number"
                {...register("sort_order", { valueAsNumber: true })}
                placeholder="65535"
                min={0}
                step={1}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                {editDept ? "Save changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
