/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { THelpLocale } from "@plane/types";
import { useInstanceHelpCenter } from "@/hooks/store";
import { HELP_LOCALES } from "./constants";
import { categoryDisplayName } from "./display-helpers";

type Props = {
  open: boolean;
  defaultCategoryId: string | null;
  onClose: () => void;
  onCreated: (articleId: string) => void;
};

// Minimal shell creation: pick category + a first title (slug is generated
// server-side from it). The full per-locale content is then edited in the panel.
export const ArticleCreateModal = observer(function ArticleCreateModal({
  open,
  defaultCategoryId,
  onClose,
  onCreated,
}: Props) {
  const { categoryIds, categories, createArticle } = useInstanceHelpCenter();
  const [categoryId, setCategoryId] = useState<string>("");
  const [locale, setLocale] = useState<THelpLocale>("vi");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoryId(defaultCategoryId ?? categoryIds[0] ?? "");
    setLocale("vi");
    setTitle("");
  }, [open, defaultCategoryId, categoryIds]);

  const onSubmit = async () => {
    if (!categoryId) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Select a category" });
      return;
    }
    if (!title.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Title is required" });
      return;
    }
    setIsSubmitting(true);
    try {
      const article = await createArticle({
        category: categoryId,
        translations: [{ locale, title: title.trim() }],
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Article created" });
      onCreated(article.id);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to create article" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <Dialog.Title>New Article</Dialog.Title>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <label htmlFor="article-category" className="block text-13 font-medium text-primary">
                Category
              </label>
              <select
                id="article-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary"
              >
                {categoryIds.map((id) => (
                  <option key={id} value={id}>
                    {categoryDisplayName(categories[id])}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="article-locale" className="block text-13 font-medium text-primary">
                First language
              </label>
              <select
                id="article-locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as THelpLocale)}
                className="w-full rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary"
              >
                {HELP_LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="article-title" className="block text-13 font-medium text-primary">
                Title
              </label>
              <Input
                id="article-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title"
                className="w-full bg-layer-2"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="button" loading={isSubmitting} onClick={() => void onSubmit()}>
              Create & edit
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
