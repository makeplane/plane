/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */
"use client";

import { observer } from "mobx-react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IStaff } from "@/services/staff.service";
import { StaffService } from "@/services/staff.service";
import { cn } from "@plane/utils";

interface StaffTableProps {
  staff: IStaff[];
  workspaceSlug: string;
  onEdit: (staff: IStaff) => void;
  onDelete: () => void;
}

const staffService = new StaffService();

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 border-green-500/20",
  probation: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  resigned: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  suspended: "bg-red-500/10 text-red-600 border-red-500/20",
  transferred: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

export const StaffTable = observer(function StaffTable({ staff, workspaceSlug, onEdit, onDelete }: StaffTableProps) {
  const handleDelete = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await staffService.deleteStaff(workspaceSlug, staffId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Staff deleted",
        message: "Staff member has been deleted successfully.",
      });
      onDelete();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to delete staff member.",
      });
    }
  };

  const handleDeactivate = async (staffId: string) => {
    if (!confirm("Are you sure you want to deactivate this staff member?")) return;

    try {
      await staffService.deactivateStaff(workspaceSlug, staffId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Staff deactivated",
        message: "Staff member has been deactivated successfully.",
      });
      onDelete();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to deactivate staff member.",
      });
    }
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-custom-border-200 bg-custom-background-100 py-12">
        <p className="text-sm text-custom-text-400">No staff members found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
      <table className="w-full">
        <thead className="bg-custom-background-80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Staff ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Department
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Position
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Joined Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-custom-text-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-custom-border-200">
          {staff.map((member) => (
            <tr key={member.id} className="hover:bg-custom-background-80">
              <td className="px-4 py-3 text-sm font-medium text-custom-text-200">{member.staff_id}</td>
              <td className="px-4 py-3 text-sm text-custom-text-200">{member.display_name || member.email || "-"}</td>
              <td className="px-4 py-3 text-sm text-custom-text-300">{member.department_detail?.name || "-"}</td>
              <td className="px-4 py-3 text-sm text-custom-text-300">{member.position || "-"}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-1 text-xs font-medium capitalize",
                    STATUS_COLORS[member.employment_status] || ""
                  )}
                >
                  {member.employment_status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-custom-text-300">
                {member.date_of_joining ? new Date(member.date_of_joining).toLocaleDateString() : "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="neutral-primary"
                    size="sm"
                    onClick={() => onEdit(member)}
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  {member.employment_status === "active" && (
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      onClick={() => handleDeactivate(member.id)}
                      className="flex items-center gap-1"
                    >
                      Deactivate
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
