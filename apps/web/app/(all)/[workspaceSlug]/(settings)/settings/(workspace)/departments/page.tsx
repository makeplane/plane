/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-floating-promises, @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
import { Plus } from "lucide-react";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { IDepartment } from "@/services/department.service";
import { DepartmentService } from "@/services/department.service";
import { DepartmentsWorkspaceSettingsHeader } from "./header";
import { DepartmentTree } from "./components/department-tree";
import { DepartmentFormModal } from "./components/department-form-modal";
import { LinkProjectModal } from "./components/link-project-modal";
import type { Route } from "./+types/page";

const departmentService = new DepartmentService();

const DepartmentsSettingsPage = observer(function DepartmentsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<IDepartment | undefined>(undefined);
  const [linkingDepartment, setLinkingDepartment] = useState<IDepartment | null>(null);

  const {
    data: departmentTree,
    isLoading,
    mutate,
  } = useSWR(workspaceSlug ? `DEPARTMENT_TREE_${workspaceSlug}` : null, () =>
    departmentService.getDepartmentTree(workspaceSlug)
  );

  const { data: allDepartments, mutate: mutateAll } = useSWR(
    workspaceSlug ? `DEPARTMENTS_${workspaceSlug}` : null,
    () => departmentService.getDepartments(workspaceSlug)
  );

  const handleAddDepartment = () => {
    setEditingDepartment(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditDepartment = (department: IDepartment) => {
    setEditingDepartment(department);
    setIsFormModalOpen(true);
  };

  const handleDeleteDepartment = () => {
    mutate();
    mutateAll();
  };

  const handleFormSuccess = () => {
    mutate();
    mutateAll();
  };

  const handleLinkProject = (department: IDepartment) => {
    setLinkingDepartment(department);
    setIsLinkModalOpen(true);
  };

  const handleLinkSuccess = () => {
    mutate();
    mutateAll();
  };

  return (
    <SettingsContentWrapper header={<DepartmentsWorkspaceSettingsHeader />}>
      <PageHead title={`${currentWorkspace?.name} - Departments`} />

      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold">Departments</h3>
            <p className="mt-1 text-sm text-custom-text-400">
              Manage your organization&apos;s departments and hierarchies
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={handleAddDepartment} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        </div>

        {isLoading ? (
          <Loader className="space-y-4">
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
            <Loader.Item height="60px" />
          </Loader>
        ) : (
          <DepartmentTree
            departments={departmentTree || []}
            workspaceSlug={workspaceSlug}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
            onLinkProject={handleLinkProject}
          />
        )}
      </div>

      <DepartmentFormModal
        workspaceSlug={workspaceSlug}
        department={editingDepartment}
        departments={allDepartments || []}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <LinkProjectModal
        workspaceSlug={workspaceSlug}
        department={linkingDepartment}
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={handleLinkSuccess}
      />
    </SettingsContentWrapper>
  );
});

export default DepartmentsSettingsPage;
