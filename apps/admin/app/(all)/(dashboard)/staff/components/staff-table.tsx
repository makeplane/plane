/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Loader as LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import { useInstanceStaff } from "@/hooks/store";
import { StaffStatusBadge } from "./staff-status-badge";
import { StaffActionButtons } from "./staff-action-buttons";

type Props = {
  onEdit: (staffId: string) => void;
};

export const StaffTable = observer(function StaffTable({ onEdit }: Props) {
  const { staff, staffIds, loader, paginationInfo, fetchNextStaff } = useInstanceStaff();

  const hasNextPage = paginationInfo?.next_page_results === true;

  if (loader === "init-loader") {
    return (
      <div className="space-y-2 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded bg-layer-2 animate-pulse" />
        ))}
      </div>
    );
  }

  if (staffIds.length === 0) {
    return <div className="text-center py-12 text-tertiary">No staff found.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-subtle overflow-hidden">
        <table className="w-full text-13">
          <thead className="bg-layer-2 border-b border-subtle">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Staff ID</th>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Name</th>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Email</th>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Department</th>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Position</th>
              <th className="px-3 py-2.5 text-left font-medium text-tertiary">Status</th>
              <th className="px-3 py-2.5 text-right font-medium text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {staffIds.map((id) => {
              const member = staff[id];
              if (!member) return null;
              const name = member.display_name || member.user_detail?.display_name || member.email;
              return (
                <tr key={id} className="hover:bg-layer-1-hover transition-colors">
                  <td className="px-3 py-2.5 font-mono text-12 text-tertiary">{member.staff_id}</td>
                  <td className="px-3 py-2.5 font-medium">{name}</td>
                  <td className="px-3 py-2.5 text-tertiary">{member.email}</td>
                  <td className="px-3 py-2.5 text-tertiary">
                    {member.department_detail?.name ?? <span className="text-12 italic">Unassigned</span>}
                  </td>
                  <td className="px-3 py-2.5 text-tertiary">{member.position || "—"}</td>
                  <td className="px-3 py-2.5">
                    <StaffStatusBadge status={member.employment_status} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <StaffActionButtons staffId={id} onEdit={() => onEdit(id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="link" size="lg" onClick={() => void fetchNextStaff()} disabled={loader === "pagination"}>
            Load more
            {loader === "pagination" && <LoaderIcon className="w-3 h-3 animate-spin" />}
          </Button>
        </div>
      )}
    </div>
  );
});
