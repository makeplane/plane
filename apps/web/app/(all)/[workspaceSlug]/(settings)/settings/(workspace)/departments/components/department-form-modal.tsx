/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button, Input, TOAST_TYPE, TextArea, setToast } from "@plane/ui";
import type { IDepartment, IDepartmentCreate, IDepartmentUpdate } from "@/services/department.service";
import { DepartmentService } from "@/services/department.service";

interface DepartmentFormModalProps {
  workspaceSlug: string;
  department?: IDepartment;
  departments: IDepartment[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentService = new DepartmentService();

export const DepartmentFormModal = observer(function DepartmentFormModal({
  workspaceSlug,
  department,
  departments,
  isOpen,
  onClose,
  onSuccess,
}: DepartmentFormModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<IDepartmentCreate>({
    name: "",
    code: "",
    short_name: "",
    dept_code: "",
    description: "",
    parent: "",
    level: 1,
    manager: "",
  });
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
      setFormData({
        name: "",
        code: "",
        short_name: "",
        dept_code: "",
        description: "",
        parent: "",
        level: 1,
        manager: "",
      });
    }
  }, [department, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (department) {
        await departmentService.updateDepartment(workspaceSlug, department.id, formData as IDepartmentUpdate);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Department updated",
          message: "Department has been updated successfully.",
        });
      } else {
        await departmentService.createDepartment(workspaceSlug, formData);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Department created",
          message: "Department has been created successfully.",
        });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Something went wrong. Please try again.",
      });
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="name"
              label="Department Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter department name"
              required
            />
            <Input
              id="code"
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter code"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="short_name"
              label="Short Name"
              value={formData.short_name}
              onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
              placeholder="Enter short name"
            />
            <Input
              id="dept_code"
              label="Department Code"
              value={formData.dept_code}
              onChange={(e) => setFormData({ ...formData, dept_code: e.target.value })}
              placeholder="Enter department code"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="parent" className="mb-2 block text-sm font-medium">
                Parent Department
              </label>
              <select
                id="parent"
                value={formData.parent}
                onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
              >
                <option value="">None (Root Department)</option>
                {departments
                  .filter((d) => d.id !== department?.id)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>
            <Input
              id="level"
              type="number"
              label="Level"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
              placeholder="Enter level"
              min={1}
            />
          </div>

          <TextArea
            id="description"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description"
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="neutral-primary" onClick={onClose} disabled={isSubmitting}>
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
