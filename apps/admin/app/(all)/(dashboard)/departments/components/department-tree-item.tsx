/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight, Pencil, Trash2, UserPlus } from "lucide-react";
import { cn } from "@plane/utils";
import type { IInstanceDepartment } from "@plane/services";
import { Button } from "@plane/propel/button";
import { DepartmentLinkWorkspace } from "./department-link-workspace";
import { DepartmentLinkTaskCategories } from "./department-link-task-categories";

type Props = {
  dept: IInstanceDepartment;
  depth?: number;
  onEdit: (dept: IInstanceDepartment) => void;
  onDelete: (id: string) => void;
  onAutoJoin: (dept: IInstanceDepartment) => void;
};

export const DepartmentTreeItem = observer(function DepartmentTreeItem({
  dept,
  depth = 0,
  onEdit,
  onDelete,
  onAutoJoin,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 hover:border-subtle hover:bg-layer-1-hover",
          "text-14"
        )}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn("h-4 w-4 flex-shrink-0 text-tertiary", !hasChildren && "invisible")}
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
        </button>

        {/* Name + code */}
        <span className="flex-1 truncate font-medium">{dept.name}</span>
        <span className="font-mono text-12 text-tertiary">{dept.code}</span>

        {/* Level badge */}
        <span className="rounded bg-layer-2 px-1.5 py-0.5 text-11 text-tertiary">L{dept.level}</span>

        {/* Staff count */}
        <span className="rounded bg-accent-subtle px-1.5 py-0.5 text-11 text-accent-primary">
          {dept.staff_count} staff
        </span>

        {/* Linked workspace */}
        <DepartmentLinkWorkspace dept={dept} />

        {/* Linked task categories */}
        <DepartmentLinkTaskCategories dept={dept} />

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => onAutoJoin(dept)} title="Auto join manager to projects">
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(dept)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="error-outline" size="sm" onClick={() => onDelete(dept.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {dept.children!.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              dept={child}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAutoJoin={onAutoJoin}
            />
          ))}
        </div>
      )}
    </div>
  );
});
