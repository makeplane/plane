/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IDepartment } from "@/services/department.service";
import { DepartmentService } from "@/services/department.service";
import { useProject } from "@/hooks/store/use-project";

interface LinkProjectModalProps {
  workspaceSlug: string;
  department: IDepartment | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const departmentService = new DepartmentService();

export const LinkProjectModal = observer(function LinkProjectModal({
  workspaceSlug,
  department,
  isOpen,
  onClose,
  onSuccess,
}: LinkProjectModalProps) {
  const { t } = useTranslation();
  const { workspaceProjectIds, getProjectById } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !selectedProjectId) return;

    setIsSubmitting(true);
    try {
      await departmentService.linkProject(workspaceSlug, department.id, selectedProjectId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Project linked",
        message: "Project has been linked to the department successfully.",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error?.message || "Failed to link project.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !department) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-backdrop">
      <div className="w-full max-w-md rounded-lg bg-custom-background-100 p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Link Project to {department.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project" className="mb-2 block text-sm font-medium">
              Select Project
            </label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm"
              required
            >
              <option value="">Choose a project</option>
              {workspaceProjectIds?.map((projectId) => {
                const project = getProjectById(projectId);
                return project ? (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="neutral-primary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Link Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});
