/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Download, Plus, Upload, Loader as LoaderIcon, RefreshCw, Link } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceDepartment } from "@plane/services";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceDepartment, useInstanceTaskCategory } from "@/hooks/store";
import { DepartmentTreeItem } from "./components/department-tree-item";
import { DepartmentFormModal } from "./components/department-form-modal";
import { AutoJoinModal } from "./components/auto-join-modal";
import { RejoinAllModal } from "./components/rejoin-all-modal";
import { BulkLinkModal } from "./components/bulk-link-modal";
import { BulkLinkCategoriesModal } from "./components/bulk-link-categories-modal";

const DepartmentsPage = observer(function DepartmentsPage() {
  const {
    tree,
    loader,
    fetchTree,
    deleteDepartment,
    exportDepartments,
    exportWorkspaceLinked,
    exportLinkedCategories,
  } = useInstanceDepartment();
  const { fetchCategories, mainCategories } = useInstanceTaskCategory();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<IInstanceDepartment | null>(null);
  const [autoJoinDept, setAutoJoinDept] = useState<IInstanceDepartment | null>(null);
  const [rejoinModalOpen, setRejoinModalOpen] = useState(false);
  const [bulkLinkOpen, setBulkLinkOpen] = useState(false);
  const [bulkLinkCategoriesOpen, setBulkLinkCategoriesOpen] = useState(false);

  useSWR("INSTANCE_DEPARTMENTS_TREE", () => fetchTree());
  useSWR("INSTANCE_TASK_CATEGORIES_FOR_DEPTS", fetchCategories);

  const handleEdit = (dept: IInstanceDepartment) => {
    setEditDept(dept);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this department? This cannot be undone.")) return;
    try {
      await deleteDepartment(id);
      void fetchTree();
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Department deleted" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to delete department" });
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditDept(null);
    void fetchTree();
  };

  return (
    <PageWrapper
      header={{
        title: "Departments",
        description: "Manage organizational departments and their workspace links.",
      }}
    >
      <div className="space-y-3">
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-16 font-medium">
            Department tree
            {loader === "mutation" && <LoaderIcon className="h-4 w-4 animate-spin text-tertiary" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => exportDepartments()}>
              <Download className="h-4 w-4" />
              Export Dept
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/departments/import")}>
              <Upload className="h-4 w-4" />
              Import Dept
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRejoinModalOpen(true)}>
              <RefreshCw className="h-4 w-4" />
              Rejoin
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBulkLinkOpen(true)}>
              <Link className="h-4 w-4" />
              Bulk Linked
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportWorkspaceLinked()}>
              <Download className="h-4 w-4" />
              Export Workspace Linked
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setBulkLinkCategoriesOpen(true)}>
              <Upload className="h-4 w-4" />
              Bulk Linked Categories
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportLinkedCategories(Object.values(mainCategories))}>
              <Download className="h-4 w-4" />
              Export Linked Categories
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditDept(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </div>
        </div>

        {loader === "init-loader" ? (
          <Loader className="space-y-3 py-4">
            <Loader.Item height="44px" width="100%" />
            <Loader.Item height="44px" width="90%" />
            <Loader.Item height="44px" width="85%" />
          </Loader>
        ) : tree.length === 0 ? (
          <div className="py-12 text-center text-tertiary">No departments found. Create the first one.</div>
        ) : (
          <div className="divide-y divide-subtle rounded-lg border border-subtle bg-layer-1">
            {tree.map((dept) => (
              <DepartmentTreeItem
                key={dept.id}
                dept={dept}
                onEdit={handleEdit}
                onDelete={(id) => void handleDelete(id)}
                onAutoJoin={setAutoJoinDept}
              />
            ))}
          </div>
        )}
      </div>

      <DepartmentFormModal open={modalOpen} onClose={handleModalClose} editDept={editDept} />
      <AutoJoinModal
        deptId={autoJoinDept?.id ?? null}
        deptName={autoJoinDept?.name ?? ""}
        onClose={() => setAutoJoinDept(null)}
      />
      <RejoinAllModal open={rejoinModalOpen} onClose={() => setRejoinModalOpen(false)} />
      <BulkLinkModal open={bulkLinkOpen} onClose={() => setBulkLinkOpen(false)} />
      <BulkLinkCategoriesModal open={bulkLinkCategoriesOpen} onClose={() => setBulkLinkCategoriesOpen(false)} />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Departments - God Mode" }];
}

export default DepartmentsPage;
