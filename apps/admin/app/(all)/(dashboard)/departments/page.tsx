/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus, Loader as LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceDepartment } from "@plane/services";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceDepartment } from "@/hooks/store";
import { DepartmentTreeItem } from "./components/department-tree-item";
import { DepartmentFormModal } from "./components/department-form-modal";

const DepartmentsPage = observer(function DepartmentsPage() {
  const { tree, loader, fetchTree, deleteDepartment } = useInstanceDepartment();
  const [modalOpen, setModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<IInstanceDepartment | null>(null);

  useSWR("INSTANCE_DEPARTMENTS_TREE", () => fetchTree());

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
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-16 font-medium">
            Department tree
            {loader === "mutation" && <LoaderIcon className="w-4 h-4 animate-spin text-tertiary" />}
          </div>
          <Button variant="primary" size="sm" onClick={() => { setEditDept(null); setModalOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>

        {loader === "init-loader" ? (
          <Loader className="space-y-3 py-4">
            <Loader.Item height="44px" width="100%" />
            <Loader.Item height="44px" width="90%" />
            <Loader.Item height="44px" width="85%" />
          </Loader>
        ) : tree.length === 0 ? (
          <div className="text-center py-12 text-tertiary">
            No departments found. Create the first one.
          </div>
        ) : (
          <div className="rounded-lg border border-subtle bg-layer-1 divide-y divide-subtle">
            {tree.map((dept) => (
              <DepartmentTreeItem
                key={dept.id}
                dept={dept}
                onEdit={handleEdit}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </div>

      <DepartmentFormModal open={modalOpen} onClose={handleModalClose} editDept={editDept} />
    </PageWrapper>
  );
});

export function meta() { return [{ title: "Departments - God Mode" }]; }

export default DepartmentsPage;
