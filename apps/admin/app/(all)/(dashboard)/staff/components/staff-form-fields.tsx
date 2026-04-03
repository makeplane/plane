/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Input } from "@plane/propel/input";
import { useInstanceDepartment } from "@/hooks/store";

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
};

export const StaffFormFields = observer(function StaffFormFields({ register, errors }: Props) {
  const { departments, departmentIds } = useInstanceDepartment();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-13 font-medium">Staff ID *</label>
          <Input {...register("staff_id", { required: "Required" })} placeholder="e.g. EMP001" />
          {errors.staff_id && <p className="text-11 text-color-danger-primary">{errors.staff_id.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Display name</label>
          <Input {...register("display_name")} placeholder="Display name" />
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">First name *</label>
          <Input {...register("first_name", { required: "Required" })} placeholder="First name" />
          {errors.first_name && <p className="text-11 text-color-danger-primary">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Last name *</label>
          <Input {...register("last_name", { required: "Required" })} placeholder="Last name" />
          {errors.last_name && <p className="text-11 text-color-danger-primary">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Email *</label>
          <Input type="email" {...register("email", { required: "Required" })} placeholder="user@example.com" />
          {errors.email && <p className="text-11 text-color-danger-primary">{errors.email.message}</p>}
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
          <label className="text-13 font-medium">Position</label>
          <Input {...register("position")} placeholder="e.g. Senior Engineer" />
        </div>
        <div className="space-y-1">
          <label className="text-13 font-medium">Job grade</label>
          <Input {...register("job_grade")} placeholder="e.g. L4" />
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
