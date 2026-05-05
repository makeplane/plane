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
          "group flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-layer-1-hover border border-transparent hover:border-subtle",
          "text-14"
        )}
        style={{ paddingLeft: `${depth * 20 + 12}px` }}
      >
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn("w-4 h-4 flex-shrink-0 text-tertiary", !hasChildren && "invisible")}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
        </button>

        {/* Name + code */}
        <span className="font-medium flex-1 truncate">{dept.name}</span>
        <span className="text-12 text-tertiary font-mono">{dept.code}</span>

        {/* Level badge */}
        <span className="text-11 px-1.5 py-0.5 rounded bg-layer-2 text-tertiary">L{dept.level}</span>

        {/* Staff count */}
        <span className="text-11 px-1.5 py-0.5 rounded bg-accent-subtle text-accent-primary">
          {dept.staff_count} staff
        </span>

        {/* Linked workspace */}
        <DepartmentLinkWorkspace dept={dept} />

        {/* Linked task categories */}
        <DepartmentLinkTaskCategories dept={dept} />

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onAutoJoin(dept)} title="Auto join manager to projects">
            <UserPlus className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit(dept)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="error-outline" size="sm" onClick={() => onDelete(dept.id)}>
            <Trash2 className="w-3.5 h-3.5" />
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
