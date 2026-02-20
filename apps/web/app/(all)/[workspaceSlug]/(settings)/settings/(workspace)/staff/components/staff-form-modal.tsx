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
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IStaff, IStaffCreate, IStaffUpdate } from "@/services/staff.service";
import { StaffService } from "@/services/staff.service";
import { DepartmentService } from "@/services/department.service";
import { StaffFormFields } from "./staff-form-fields";

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
  const { t } = useTranslation();
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
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("staff.updated") });
      } else {
        await staffService.createStaff(workspaceSlug, formData);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("staff.created") });
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error?.message || error?.error || t("something_went_wrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-backdrop">
      <div className="w-full max-w-2xl rounded-lg bg-custom-background-100 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">{isEditing ? t("staff.edit") : t("staff.add")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <StaffFormFields
            formData={formData}
            onChange={setFormData}
            departments={departments}
            isEditing={isEditing}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isEditing ? t("update") : t("create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
