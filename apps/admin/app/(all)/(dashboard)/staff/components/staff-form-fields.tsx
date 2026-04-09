/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue, Control } from "react-hook-form";
import { Input } from "@plane/propel/input";
import { useInstanceDepartment, useInstanceJobPosition } from "@/hooks/store";

export type StaffFormValues = {
  staff_id: string;
  first_name: string;
  last_name: string;
  email: string;
  display_name: string;
  department: string;
  position: string;
  job_grade: string;
  phone: string;
  date_of_joining: string;
  is_department_manager: boolean;
  notes: string;
  employment_status: "active" | "probation" | "resigned" | "suspended" | "transferred";
};

type Props = {
  register: UseFormRegister<StaffFormValues>;
  errors: FieldErrors<StaffFormValues>;
  watch: UseFormWatch<StaffFormValues>;
  setValue: UseFormSetValue<StaffFormValues>;
  control: Control<StaffFormValues>;
};

export const StaffFormFields = observer(function StaffFormFields({
  register,
  errors,
  watch,
  setValue,
  control,
}: Props) {
  const { departments, departmentIds } = useInstanceDepartment();
  const { grades, positions, hasFetched, fetchAll } = useInstanceJobPosition();

  // Local state for selected grade ID — drives position filtering reliably
  const [selectedGradeId, setSelectedGradeId] = useState<string>("");

  useEffect(() => {
    if (!hasFetched) fetchAll();
  }, [hasFetched, fetchAll]);

  // Sync selectedGradeId when the watched grade name or data availability changes (e.g., edit modal reset)
  const watchedGradeName = watch("job_grade");
  useEffect(() => {
    const gradeObj = Object.values(grades).find((g) => g.name === watchedGradeName);
    setSelectedGradeId(gradeObj?.id ?? "");
  }, [watchedGradeName, hasFetched]); // hasFetched ensures sync after initial data load

  const activeGrades = Object.values(grades).filter((g) => g.is_active);

  // Access positions observable directly so MobX tracks it for reactivity
  const filteredPositions = Object.values(positions).filter((p) => p.job_grade === selectedGradeId && p.is_active);

  const gradeRegistration = register("job_grade");

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    void gradeRegistration.onChange(e); // update react-hook-form state
    const gradeObj = activeGrades.find((g) => g.name === e.target.value);
    setSelectedGradeId(gradeObj?.id ?? ""); // update local state immediately → re-render positions
    setValue("position", ""); // reset selected position
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-13 font-medium">Staff ID *</label>
          <Input {...register("staff_id", { required: "Required" })} placeholder="e.g. EMP001" />
          {errors.staff_id && <p className="text-11 text-danger-primary">{errors.staff_id.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Display name</label>
          <Input {...register("display_name")} placeholder="Display name" />
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">First name *</label>
          <Input {...register("first_name", { required: "Required" })} placeholder="First name" />
          {errors.first_name && <p className="text-11 text-danger-primary">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Last name *</label>
          <Input {...register("last_name", { required: "Required" })} placeholder="Last name" />
          {errors.last_name && <p className="text-11 text-danger-primary">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Email *</label>
          <Input type="email" {...register("email", { required: "Required" })} placeholder="user@example.com" />
          {errors.email && <p className="text-11 text-danger-primary">{errors.email.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Phone</label>
          <Input {...register("phone")} placeholder="+84..." />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-13 font-medium">Department</label>
          <select
            {...register("department")}
            className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
          >
            <option value="">— None —</option>
            {departmentIds.map((id) => (
              <option key={id} value={id}>
                {departments[id]?.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Status</label>
          <select
            {...register("employment_status")}
            className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
          >
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="resigned">Resigned</option>
            <option value="suspended">Suspended</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Job grade</label>
          <select
            {...gradeRegistration}
            onChange={handleGradeChange}
            className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13"
          >
            <option value="">— None —</option>
            {activeGrades.map((grade) => (
              <option key={grade.id} value={grade.name}>
                {grade.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Position</label>
          {/* Controller keeps value in sync with form state (not DOM) — fixes edit case where
              options load after reset() is called, causing uncontrolled select to lose its value */}
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                disabled={!selectedGradeId}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-13 disabled:opacity-50"
              >
                <option value="">— None —</option>
                {filteredPositions.map((pos) => (
                  <option key={pos.id} value={pos.name}>
                    {pos.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Date of joining</label>
          <Input type="date" {...register("date_of_joining")} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_department_manager" {...register("is_department_manager")} className="rounded" />
        <label htmlFor="is_department_manager" className="text-13">
          Department manager
        </label>
      </div>

      <div className="space-y-1">
        <label className="text-13 font-medium">Notes</label>
        <Input {...register("notes")} placeholder="Optional notes" />
      </div>
    </div>
  );
});
