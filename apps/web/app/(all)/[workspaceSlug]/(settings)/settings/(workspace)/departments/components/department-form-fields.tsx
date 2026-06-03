/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Input } from "@plane/propel/input";
import { TextArea } from "@plane/ui";
import type { IDepartment, IDepartmentCreate } from "@/plane-web/services/department.service";

interface DepartmentFormFieldsProps {
  formData: IDepartmentCreate;
  onChange: (data: IDepartmentCreate) => void;
  departments: IDepartment[];
  editingDepartmentId?: string;
}

/**
 * Renders form fields for creating/editing a department.
 * Extracted from DepartmentFormModal for file-size compliance.
 */
export const DepartmentFormFields = ({
  formData,
  onChange,
  departments,
  editingDepartmentId,
}: DepartmentFormFieldsProps) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="name" className="text-sm mb-1 block font-medium">
          Department Name
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="Enter department name"
          required
        />
      </div>
      <div>
        <label htmlFor="code" className="text-sm mb-1 block font-medium">
          Code
        </label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => onChange({ ...formData, code: e.target.value })}
          placeholder="Enter code"
          required
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="short_name" className="text-sm mb-1 block font-medium">
          Short Name
        </label>
        <Input
          id="short_name"
          value={formData.short_name}
          onChange={(e) => onChange({ ...formData, short_name: e.target.value })}
          placeholder="Enter short name"
        />
      </div>
      <div>
        <label htmlFor="dept_code" className="text-sm mb-1 block font-medium">
          Department Code
        </label>
        <Input
          id="dept_code"
          value={formData.dept_code}
          onChange={(e) => onChange({ ...formData, dept_code: e.target.value })}
          placeholder="Enter department code"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="parent" className="text-sm mb-2 block font-medium">
          Parent Department
        </label>
        <select
          id="parent"
          value={formData.parent}
          onChange={(e) => onChange({ ...formData, parent: e.target.value })}
          className="border-custom-border-200 bg-custom-background-100 text-sm w-full rounded-md border px-3 py-2"
        >
          <option value="">None (Root Department)</option>
          {departments
            .filter((d) => d.id !== editingDepartmentId)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label htmlFor="level" className="text-sm mb-1 block font-medium">
          Level
        </label>
        <Input
          id="level"
          type="number"
          value={formData.level}
          onChange={(e) => onChange({ ...formData, level: parseInt(e.target.value) || 1 })}
          placeholder="Enter level"
          min={1}
        />
      </div>
    </div>

    <div>
      <label htmlFor="description" className="text-sm mb-1 block font-medium">
        Description
      </label>
      <TextArea
        id="description"
        value={formData.description}
        onChange={(e) => onChange({ ...formData, description: e.target.value })}
        placeholder="Enter description"
        rows={3}
      />
    </div>
  </>
);
