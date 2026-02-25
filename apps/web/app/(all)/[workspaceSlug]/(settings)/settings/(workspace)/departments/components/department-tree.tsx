/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { IDepartment } from "@/plane-web/services/department.service";
import { DepartmentTreeItem } from "./department-tree-item";

interface DepartmentTreeProps {
  departments: IDepartment[];
  workspaceSlug: string;
  onEdit: (department: IDepartment) => void;
  onDelete: (departmentId: string) => void;
  onLinkProject: (department: IDepartment) => void;
}

export const DepartmentTree = observer(function DepartmentTree({
  departments,
  workspaceSlug,
  onEdit,
  onDelete,
  onLinkProject,
}: DepartmentTreeProps) {
  const { t } = useTranslation();

  if (!departments || departments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <p className="text-sm text-custom-text-400">{t("department.empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-custom-border-200 bg-custom-background-100">
      {departments.map((department) => (
        <DepartmentTreeItem
          key={department.id}
          department={department}
          workspaceSlug={workspaceSlug}
          onEdit={onEdit}
          onDelete={onDelete}
          onLinkProject={onLinkProject}
        />
      ))}
    </div>
  );
});
