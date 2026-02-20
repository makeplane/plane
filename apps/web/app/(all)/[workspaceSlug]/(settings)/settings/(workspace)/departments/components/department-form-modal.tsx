/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDepartment, IDepartmentCreate, IDepartmentUpdate } from "@/services/department.service";
import { DepartmentService } from "@/services/department.service";
import { DepartmentFormFields } from "./department-form-fields";

interface DepartmentFormModalProps {
  workspaceSlug: string;
  department?: IDepartment;
  departments: IDepartment[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentService = new DepartmentService();

const INITIAL_FORM_DATA: IDepartmentCreate = {
  name: "",
  code: "",
  short_name: "",
  dept_code: "",
  description: "",
  parent: "",
  level: 1,
  manager: "",
};

export const DepartmentFormModal = observer(function DepartmentFormModal({
  workspaceSlug,
  department,
  departments,
  isOpen,
  onClose,
  onSuccess,
}: DepartmentFormModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<IDepartmentCreate>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        short_name: department.short_name || "",
        dept_code: department.dept_code || "",
        description: department.description || "",
        parent: department.parent || "",
        level: department.level,
        manager: department.manager || "",
      });
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [department, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (department) {
        await departmentService.updateDepartment(workspaceSlug, department.id, formData as IDepartmentUpdate);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Department updated", message: "Department has been updated successfully." });
      } else {
        await departmentService.createDepartment(workspaceSlug, formData);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Department created", message: "Department has been created successfully." });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: error?.message || "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-backdrop">
      <div className="w-full max-w-2xl rounded-lg bg-custom-background-100 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">{department ? "Edit Department" : "Add Department"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DepartmentFormFields
            formData={formData}
            onChange={setFormData}
            departments={departments}
            editingDepartmentId={department?.id}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {department ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
