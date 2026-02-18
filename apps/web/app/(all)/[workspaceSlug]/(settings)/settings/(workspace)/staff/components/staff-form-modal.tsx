/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */
"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button, Input } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IStaff, IStaffCreate, IStaffUpdate } from "@/services/staff.service";
import { StaffService } from "@/services/staff.service";
import { DepartmentService } from "@/services/department.service";

interface StaffFormModalProps {
  workspaceSlug: string;
  staff?: IStaff;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const staffService = new StaffService();
const departmentService = new DepartmentService();

const INITIAL_CREATE: IStaffCreate = {
  staff_id: "",
  first_name: "",
  last_name: "",
  department_id: "",
  position: "",
  job_grade: "",
  phone: "",
  date_of_joining: "",
  is_department_manager: false,
  password: "",
  notes: "",
};

export const StaffFormModal = observer(function StaffFormModal({
  workspaceSlug,
  staff,
  isOpen,
  onClose,
  onSuccess,
}: StaffFormModalProps) {
  const [formData, setFormData] = useState<IStaffCreate>(INITIAL_CREATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!staff;

  const { data: departments } = useSWR(workspaceSlug ? `DEPARTMENTS_${workspaceSlug}` : null, () =>
    departmentService.getDepartments(workspaceSlug)
  );

  useEffect(() => {
    if (staff) {
      setFormData({
        staff_id: staff.staff_id,
        first_name: staff.user_detail?.first_name || "",
        last_name: staff.user_detail?.last_name || "",
        department_id: staff.department || "",
        position: staff.position || "",
        job_grade: staff.job_grade || "",
        phone: staff.phone || "",
        date_of_joining: staff.date_of_joining || "",
        is_department_manager: staff.is_department_manager || false,
        password: "",
        notes: staff.notes || "",
      });
    } else {
      setFormData(INITIAL_CREATE);
    }
  }, [staff, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditing) {
        const updateData: IStaffUpdate = {
          department: formData.department_id || undefined,
          position: formData.position,
          job_grade: formData.job_grade,
          phone: formData.phone,
          date_of_joining: formData.date_of_joining || null,
          is_department_manager: formData.is_department_manager,
          notes: formData.notes,
        };
        await staffService.updateStaff(workspaceSlug, staff.id, updateData);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff updated" });
      } else {
        await staffService.createStaff(workspaceSlug, formData);
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff created" });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || error?.error || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-backdrop">
      <div className="w-full max-w-2xl rounded-lg bg-custom-background-100 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">{isEditing ? "Edit Staff" : "Add Staff"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              id="staff_id"
              placeholder="Staff ID (e.g. 18506320)"
              value={formData.staff_id}
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
              required
              disabled={isEditing}
            />
            <Input
              id="last_name"
              placeholder="Last name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              disabled={isEditing}
            />
            <Input
              id="first_name"
              placeholder="First name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              disabled={isEditing}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium">
                Department
              </label>
              <select
                id="department"
                value={formData.department_id || ""}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value || null })}
                className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
              >
                <option value="">Select Department</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              id="position"
              placeholder="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              id="job_grade"
              placeholder="Job grade"
              value={formData.job_grade}
              onChange={(e) => setFormData({ ...formData, job_grade: e.target.value })}
            />
            <Input
              id="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              id="date_of_joining"
              type="date"
              placeholder="Date of joining"
              value={formData.date_of_joining || ""}
              onChange={(e) => setFormData({ ...formData, date_of_joining: e.target.value })}
            />
          </div>

          {!isEditing && (
            <Input
              id="password"
              type="password"
              placeholder="Initial password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.is_department_manager}
              onChange={(e) => setFormData({ ...formData, is_department_manager: e.target.checked })}
              className="rounded border-custom-border-200"
            />
            Department Manager (auto-join children projects)
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="neutral-primary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
