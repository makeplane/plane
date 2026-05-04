/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDayOverride } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";
import { DayOverrideFormModal } from "./day-override-form-modal";

type Props = {
  scheduleId: string;
  overrides: IDayOverride[];
};

const TYPE_LABEL: Record<string, string> = {
  WORKDAY: "Make-up workday",
  HOLIDAY: "Make-up day off",
};

const TYPE_STYLE: Record<string, string> = {
  WORKDAY: "bg-warning-subtle text-warning-primary",
  HOLIDAY: "bg-success-subtle text-success-primary",
};

export const DayOverridesTable = observer(function DayOverridesTable({ scheduleId, overrides }: Props) {
  const { deleteOverride } = useBusinessCalendar();
  const [editOverride, setEditOverride] = useState<IDayOverride | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this override?")) return;
    setDeletingId(id);
    try {
      await deleteOverride(scheduleId, id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Override deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete override" });
    } finally {
      setDeletingId(null);
    }
  };

  if (overrides.length === 0) {
    return (
      <div className="py-8 text-center text-body-sm-regular text-secondary border border-dashed border-subtle rounded-lg">
        No overrides for this year
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto border border-subtle rounded-lg">
        <table className="w-full text-body-sm-regular">
          <thead className="bg-surface-2 border-b border-subtle">
            <tr>
              <th className="text-left px-4 py-2 text-body-xs-semibold text-secondary">Date</th>
              <th className="text-left px-4 py-2 text-body-xs-semibold text-secondary">Type</th>
              <th className="text-left px-4 py-2 text-body-xs-semibold text-secondary">Swap with</th>
              <th className="text-left px-4 py-2 text-body-xs-semibold text-secondary">Reason</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {overrides.map((ov) => (
              <tr key={ov.id} className="bg-surface-1 hover:bg-surface-2 transition-colors">
                <td className="px-4 py-2.5 text-primary font-mono text-caption-sm-regular">{ov.date}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-caption-sm-medium ${TYPE_STYLE[ov.type] ?? ""}`}>
                    {TYPE_LABEL[ov.type] ?? ov.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-secondary font-mono text-caption-sm-regular">
                  {ov.swap_with_date ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-secondary max-w-[200px] truncate">{ov.reason}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setEditOverride(ov)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleDelete(ov.id)}
                      disabled={deletingId === ov.id}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-danger-primary" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DayOverrideFormModal
        scheduleId={scheduleId}
        open={!!editOverride}
        onClose={() => setEditOverride(null)}
        editOverride={editOverride}
      />
    </>
  );
});
