/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IStaff } from "@/services/staff.service";

interface StaffActionButtonsProps {
  member: IStaff;
  onEdit: (staff: IStaff) => void;
  onDeactivate: (staffId: string) => Promise<void>;
  onDelete: (staffId: string) => Promise<void>;
}

/** Edit / Deactivate / Delete action buttons for a single staff row. */
export const StaffActionButtons = ({ member, onEdit, onDeactivate, onDelete }: StaffActionButtonsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onEdit(member)}
        className="flex items-center gap-1"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
      {member.employment_status === "active" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDeactivate(member.id)}
          className="flex items-center gap-1"
        >
          {t("staff.deactivate")}
        </Button>
      )}
      <Button
        variant="error-outline"
        size="sm"
        onClick={() => onDelete(member.id)}
        className="flex items-center gap-1"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
