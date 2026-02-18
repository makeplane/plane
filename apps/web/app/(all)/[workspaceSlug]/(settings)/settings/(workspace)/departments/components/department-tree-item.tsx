/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises */
"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, Edit2, Link2, Trash2, Users } from "lucide-react";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDepartment } from "@/services/department.service";
import { DepartmentService } from "@/services/department.service";

interface DepartmentTreeItemProps {
  department: IDepartment;
  workspaceSlug: string;
  onEdit: (department: IDepartment) => void;
  onDelete: (departmentId: string) => void;
  onLinkProject: (department: IDepartment) => void;
  level?: number;
}

const departmentService = new DepartmentService();

export const DepartmentTreeItem = observer(function DepartmentTreeItem({
  department,
  workspaceSlug,
  onEdit,
  onDelete,
  onLinkProject,
  level = 0,
}: DepartmentTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasChildren = department.children && department.children.length > 0;
  const isLeaf = !hasChildren;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this department?")) return;

    setIsDeleting(true);
    try {
      await departmentService.deleteDepartment(workspaceSlug, department.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Department deleted",
        message: "Department has been deleted successfully.",
      });
      onDelete(department.id);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to delete department.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-b border-custom-border-200 last:border-b-0">
      <div
        className="flex items-center gap-3 py-3 px-4 hover:bg-custom-background-80"
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 text-custom-text-300 hover:text-custom-text-200"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex flex-1 items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-custom-text-100">{department.name}</span>
              <span className="text-xs text-custom-text-300">({department.code})</span>
            </div>
            {department.description && <p className="mt-1 text-xs text-custom-text-300">{department.description}</p>}
          </div>

          <div className="flex items-center gap-4 text-sm text-custom-text-300">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{department.staff_count || 0}</span>
            </div>

            {department.manager_detail && (
              <div className="text-xs">
                <span className="text-custom-text-400">Manager: </span>
                <span className="text-custom-text-300">{department.manager_detail.display_name}</span>
              </div>
            )}

            {department.linked_project_detail && (
              <div className="text-xs">
                <span className="text-custom-text-400">Project: </span>
                <span className="text-custom-text-300">{department.linked_project_detail.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLeaf && !department.linked_project && (
              <Button
                variant="neutral-primary"
                size="sm"
                onClick={() => onLinkProject(department)}
                className="flex items-center gap-1"
              >
                <Link2 className="h-3 w-3" />
                Link Project
              </Button>
            )}

            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => onEdit(department)}
              className="flex items-center gap-1"
            >
              <Edit2 className="h-3 w-3" />
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={isDeleting}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {department.children?.map((child) => (
            <DepartmentTreeItem
              key={child.id}
              department={child}
              workspaceSlug={workspaceSlug}
              onEdit={onEdit}
              onDelete={onDelete}
              onLinkProject={onLinkProject}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});
