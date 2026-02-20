/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import type { IStaffCreate } from "@/services/staff.service";
import type { IDepartment } from "@/services/department.service";

interface StaffFormFieldsProps {
  formData: IStaffCreate;
  onChange: (data: IStaffCreate) => void;
  departments?: IDepartment[];
  isEditing: boolean;
}

/**
 * Renders form fields for creating/editing a staff member.
 * Extracted from StaffFormModal for file-size compliance.
 */
export const StaffFormFields = ({ formData, onChange, departments, isEditing }: StaffFormFieldsProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Input
          id="staff_id"
          placeholder={t("staff.staff_id.placeholder")}
          value={formData.staff_id}
          onChange={(e) => onChange({ ...formData, staff_id: e.target.value })}
          required
          disabled={isEditing}
        />
        <Input
          id="last_name"
          placeholder={t("staff.last_name.placeholder")}
          value={formData.last_name}
          onChange={(e) => onChange({ ...formData, last_name: e.target.value })}
          required
          disabled={isEditing}
        />
        <Input
          id="first_name"
          placeholder={t("staff.first_name.placeholder")}
          value={formData.first_name}
          onChange={(e) => onChange({ ...formData, first_name: e.target.value })}
          required
          disabled={isEditing}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="department" className="mb-1 block text-sm font-medium">
            {t("staff.department.label")}
          </label>
          <select
            id="department"
            value={formData.department_id || ""}
            onChange={(e) => onChange({ ...formData, department_id: e.target.value || null })}
            className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
          >
            <option value="">{t("staff.department.select")}</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="position"
          placeholder={t("staff.position.placeholder")}
          value={formData.position}
          onChange={(e) => onChange({ ...formData, position: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          id="job_grade"
          placeholder={t("staff.job_grade.placeholder")}
          value={formData.job_grade}
          onChange={(e) => onChange({ ...formData, job_grade: e.target.value })}
        />
        <Input
          id="phone"
          placeholder={t("staff.phone.placeholder")}
          value={formData.phone}
          onChange={(e) => onChange({ ...formData, phone: e.target.value })}
        />
        <Input
          id="date_of_joining"
          type="date"
          placeholder={t("staff.date_of_joining.placeholder")}
          value={formData.date_of_joining || ""}
          onChange={(e) => onChange({ ...formData, date_of_joining: e.target.value })}
        />
      </div>

      {!isEditing && (
        <Input
          id="password"
          type="password"
          placeholder={t("staff.password.placeholder")}
          value={formData.password}
          onChange={(e) => onChange({ ...formData, password: e.target.value })}
          required
        />
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.is_department_manager}
          onChange={(e) => onChange({ ...formData, is_department_manager: e.target.checked })}
          className="rounded border-custom-border-200"
        />
        {t("staff.is_department_manager")}
      </label>
    </>
  );
};
