/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Download, Plus, Upload } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
import type { IHelpArticle, IHelpCategory } from "@plane/types";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceHelpCenter } from "@/hooks/store";
import { ArticleCreateModal } from "./components/article-create-modal";
import { ArticleEditorPanel } from "./components/article-editor-panel";
import { ArticleList } from "./components/article-list";
import { CategoryFormModal } from "./components/category-form-modal";
import { CategoryList } from "./components/category-list";
import { DeleteConfirmModal } from "./components/delete-confirm-modal";
import { ImportBundleModal } from "./components/import-bundle-modal";

const HelpCenterPage = observer(function HelpCenterPage() {
  const { loader, fetchAll, deleteCategory, deleteArticle, exportBundle } = useInstanceHelpCenter();
  useSWR("INSTANCE_HELP_CENTER", fetchAll);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<IHelpCategory | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IHelpCategory | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<IHelpArticle | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const openNewCategory = () => {
    setEditCategory(null);
    setCategoryModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBundle();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "help_center_bundle.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Export failed" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageWrapper
      header={{
        title: "Help Center",
        description: "Author the shared help guide shown to every workspace (multilingual VI/EN/KO).",
        actions: (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={isExporting} onClick={() => void handleExport()}>
              <Download className="size-4" />
              Export bundle
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="size-4" />
              Import bundle
            </Button>
          </div>
        ),
      }}
    >
      {editingArticleId ? (
        <ArticleEditorPanel articleId={editingArticleId} onClose={() => setEditingArticleId(null)} />
      ) : loader === "init-loader" ? (
        <Loader className="space-y-3 py-4">
          <Loader.Item height="44px" width="100%" />
          <Loader.Item height="44px" width="90%" />
          <Loader.Item height="44px" width="85%" />
        </Loader>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-13 font-medium text-secondary">Categories</span>
              <Button variant="primary" size="sm" onClick={openNewCategory}>
                <Plus className="size-4" />
                Add Category
              </Button>
            </div>
            <CategoryList
              selectedCategoryId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
              onEdit={(category) => {
                setEditCategory(category);
                setCategoryModalOpen(true);
              }}
              onDelete={setCategoryToDelete}
            />
          </div>
          <ArticleList
            selectedCategoryId={selectedCategoryId}
            onCreate={() => setArticleModalOpen(true)}
            onEdit={(article) => setEditingArticleId(article.id)}
            onDelete={setArticleToDelete}
          />
        </div>
      )}

      <CategoryFormModal
        open={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditCategory(null);
        }}
        editCategory={editCategory}
      />
      <ArticleCreateModal
        open={articleModalOpen}
        defaultCategoryId={selectedCategoryId}
        onClose={() => setArticleModalOpen(false)}
        onCreated={(articleId) => {
          setArticleModalOpen(false);
          setEditingArticleId(articleId);
        }}
      />
      <DeleteConfirmModal
        open={!!categoryToDelete}
        title="Delete category"
        description="Articles in this category will be left without a category. This cannot be undone."
        onConfirm={async () => {
          if (!categoryToDelete) return;
          await deleteCategory(categoryToDelete.id);
          if (selectedCategoryId === categoryToDelete.id) setSelectedCategoryId(null);
          setToast({ type: TOAST_TYPE.SUCCESS, title: "Category deleted" });
        }}
        onClose={() => setCategoryToDelete(null)}
      />
      <DeleteConfirmModal
        open={!!articleToDelete}
        title="Delete article"
        description="This article will be removed from the help center. This cannot be undone."
        onConfirm={async () => {
          if (!articleToDelete) return;
          await deleteArticle(articleToDelete.id);
          setToast({ type: TOAST_TYPE.SUCCESS, title: "Article deleted" });
        }}
        onClose={() => setArticleToDelete(null)}
      />
      <ImportBundleModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function meta() {
  return [{ title: "Help Center - God Mode" }];
}

export default HelpCenterPage;
