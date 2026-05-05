/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Download, Plus, Upload, Loader as LoaderIcon } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Loader } from "@plane/ui";
import type { IMainTaskCategory, ISubTaskCategory } from "@plane/types";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceTaskCategory } from "@/hooks/store";
import { MainCategoryList } from "./components/main-category-list";
import { SubCategoryList } from "./components/sub-category-list";
import { MainCategoryFormModal } from "./components/main-category-form-modal";
import { SubCategoryFormModal } from "./components/sub-category-form-modal";
import { TaskCategoryImportModal } from "./components/task-category-import-modal";

async function exportToExcel(
  mains: IMainTaskCategory[],
  subs: ISubTaskCategory[],
  mainById: Record<string, IMainTaskCategory>
) {
  const XLSX = await import("xlsx");
  const headers = ["type", "main_category_name", "name", "description", "sort_order", "is_active"];
  const mainRows = mains.map((m) => ["main", "", m.name, m.description ?? "", m.sort_order, m.is_active]);
  const subRows = subs.map((s) => [
    "sub",
    mainById[s.main_category]?.name ?? "",
    s.name,
    "",
    s.sort_order,
    s.is_active,
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...mainRows, ...subRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Task Categories");
  XLSX.writeFile(wb, "task-categories.xlsx");
}

const TaskCategoriesPage = observer(function TaskCategoriesPage() {
  const { loader, fetchCategories, mainCategories, subCategories } = useInstanceTaskCategory();

  const [selectedMainId, setSelectedMainId] = useState<string | null>(null);
  const [mainModalOpen, setMainModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editMain, setEditMain] = useState<IMainTaskCategory | null>(null);
  const [editSub, setEditSub] = useState<ISubTaskCategory | null>(null);

  useSWR("INSTANCE_TASK_CATEGORIES", fetchCategories);

  const handleEditMain = (cat: IMainTaskCategory) => {
    setEditMain(cat);
    setMainModalOpen(true);
  };

  const handleEditSub = (cat: ISubTaskCategory) => {
    setEditSub(cat);
    setSubModalOpen(true);
  };

  const handleMainModalClose = () => {
    setMainModalOpen(false);
    setEditMain(null);
  };

  const handleSubModalClose = () => {
    setSubModalOpen(false);
    setEditSub(null);
  };

  const handleAddSub = () => {
    setEditSub(null);
    setSubModalOpen(true);
  };

  return (
    <PageWrapper
      header={{
        title: "Task Categories",
        description: "Manage main and sub task categories for work items.",
      }}
    >
      <div className="space-y-3">
        <div className="pt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-16 font-medium">
            Categories
            {loader === "mutation" && <LoaderIcon className="w-4 h-4 animate-spin text-tertiary" />}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void exportToExcel(Object.values(mainCategories), Object.values(subCategories), mainCategories)
              }
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        </div>

        {loader === "init-loader" ? (
          <Loader className="space-y-3 py-4">
            <Loader.Item height="44px" width="100%" />
            <Loader.Item height="44px" width="90%" />
            <Loader.Item height="44px" width="85%" />
          </Loader>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-13 font-medium text-secondary">Main categories</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditMain(null);
                    setMainModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Main Category
                </Button>
              </div>
              <MainCategoryList selectedMainId={selectedMainId} onSelect={setSelectedMainId} onEdit={handleEditMain} />
            </div>
            <div className="space-y-2">
              <SubCategoryList selectedMainId={selectedMainId} onEdit={handleEditSub} onAddSub={handleAddSub} />
            </div>
          </div>
        )}
      </div>

      <MainCategoryFormModal open={mainModalOpen} onClose={handleMainModalClose} editCategory={editMain} />
      <SubCategoryFormModal
        open={subModalOpen}
        onClose={handleSubModalClose}
        editCategory={editSub}
        defaultMainId={selectedMainId}
      />
      <TaskCategoryImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Task Categories - God Mode" }];
}

export default TaskCategoriesPage;
