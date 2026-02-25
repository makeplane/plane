/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IStaff } from "@/plane-web/services/staff.service";
import { StaffService } from "@/plane-web/services/staff.service";
import { StaffStatusBadge } from "./staff-status-badge";
import { StaffActionButtons } from "./staff-action-buttons";

interface StaffTableProps {
  staff: IStaff[];
  workspaceSlug: string;
  onEdit: (staff: IStaff) => void;
  onDelete: () => void;
}

const staffService = new StaffService();

export const StaffTable = observer(function StaffTable({ staff, workspaceSlug, onEdit, onDelete }: StaffTableProps) {
  const { t } = useTranslation();

  const handleDelete = async (staffId: string) => {
    if (!confirm(t("staff.delete_confirm"))) return;
    try {
      await staffService.deleteStaff(workspaceSlug, staffId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("staff.deleted"), message: t("staff.deleted_message") });
      onDelete();
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.message || t("staff.delete_failed") });
    }
  };

  const handleDeactivate = async (staffId: string) => {
    if (!confirm(t("staff.deactivate_confirm"))) return;
    try {
      await staffService.deactivateStaff(workspaceSlug, staffId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("staff.deactivated"), message: t("staff.deactivated_message") });
      onDelete();
    } catch (error: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.message || t("staff.deactivate_failed") });
    }
  };

  if (!staff || staff.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-custom-border-200 bg-custom-background-100 py-12">
        <p className="text-sm text-custom-text-400">{t("staff.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
      <table className="w-full">
        <thead className="bg-custom-background-80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.staff_id.label")}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("name")}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.department.label")}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.position.label")}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.status.label")}</th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.date_of_joining.label")}</th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-custom-text-300">{t("staff.actions")}</th>
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
                <StaffStatusBadge status={member.employment_status} />
              </td>
              <td className="px-4 py-3 text-sm text-custom-text-300">
                {member.date_of_joining ? new Date(member.date_of_joining).toLocaleDateString() : "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <StaffActionButtons
                  member={member}
                  onEdit={onEdit}
                  onDeactivate={handleDeactivate}
                  onDelete={handleDelete}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
