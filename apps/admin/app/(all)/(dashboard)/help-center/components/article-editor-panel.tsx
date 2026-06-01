/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { useInstanceHelpCenter } from "@/hooks/store";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { DiscardChangesModal } from "./discard-changes-modal";
import { articleDisplayTitle } from "./display-helpers";
import { TranslationTabs } from "./translation-tabs";
import { useUnsavedChangesGuard } from "./use-unsaved-changes-guard";

type Props = {
  articleId: string;
  onClose: () => void;
};

export const ArticleEditorPanel = observer(function ArticleEditorPanel({ articleId, onClose }: Props) {
  const { getArticleById, updateArticle, deleteArticle } = useInstanceHelpCenter();
  const article = getArticleById(articleId);
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [isMutating, setIsMutating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [leaveRequested, setLeaveRequested] = useState(false);
  // Hold in-app navigation (browser Back / sidebar) + warn on unload while dirty.
  const blocker = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    setSlug(article?.slug ?? "");
  }, [article?.slug]);

  // If the article disappears from the store (e.g. deleted elsewhere), return to
  // the dashboard — done in an effect so we never update the parent during render.
  useEffect(() => {
    if (!article) onClose();
  }, [article, onClose]);

  if (!article) return null;

  const isDraft = article.status === "draft";
  const hasTitledTranslation = article.translations.some((t) => (t.title ?? "").trim());

  const saveSlug = async () => {
    if (!isDraft || slug.trim() === article.slug || !slug.trim()) {
      setSlug(article.slug);
      return;
    }
    try {
      const updated = await updateArticle(article.id, { slug: slug.trim() });
      setSlug(updated.slug);
    } catch {
      setSlug(article.slug);
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update slug" });
    }
  };

  const toggleStatus = async () => {
    const nextStatus = isDraft ? "published" : "draft";
    if (nextStatus === "published" && !hasTitledTranslation) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Add at least one translated title before publishing" });
      return;
    }
    setIsMutating(true);
    try {
      await updateArticle(article.id, { status: nextStatus });
      setToast({ type: TOAST_TYPE.SUCCESS, title: nextStatus === "published" ? "Published" : "Moved to draft" });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update status" });
    } finally {
      setIsMutating(false);
    }
  };

  // Leaving is gated when a draft is dirty. Two routes in: the Back button
  // (local state, no URL change) and the route blocker (browser Back / links).
  const isBlocked = blocker.state === "blocked";
  const isLeavePromptOpen = leaveRequested || isBlocked;

  const handleBack = () => {
    if (isDirty) setLeaveRequested(true);
    else onClose();
  };
  const confirmLeave = () => {
    setLeaveRequested(false);
    if (isBlocked) blocker.proceed();
    else onClose();
  };
  const cancelLeave = () => {
    setLeaveRequested(false);
    if (isBlocked) blocker.reset();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h2 className="text-16 font-medium text-primary">{articleDisplayTitle(article)}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip tooltipContent={isDraft ? "Slug can only change while in draft" : "Slug is frozen after publishing"}>
            <div className="flex items-center gap-1.5">
              <span className="text-12 text-tertiary">/help/a/</span>
              <Input
                value={slug}
                disabled={!isDraft}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={() => void saveSlug()}
                className="w-48 bg-layer-2"
              />
            </div>
          </Tooltip>
          <Button
            variant={isDraft ? "primary" : "secondary"}
            size="sm"
            loading={isMutating}
            disabled={isDraft && !hasTitledTranslation}
            onClick={() => void toggleStatus()}
          >
            {isDraft ? "Publish" : "Unpublish"}
          </Button>
          <Button variant="error-outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <TranslationTabs article={article} onDirtyChange={setIsDirty} />

      <DiscardChangesModal open={isLeavePromptOpen} onConfirm={confirmLeave} onCancel={cancelLeave} />

      <DeleteConfirmModal
        open={deleteOpen}
        title="Delete article"
        description="This article will be removed from the help center. This cannot be undone."
        onConfirm={async () => {
          await deleteArticle(article.id);
          setToast({ type: TOAST_TYPE.SUCCESS, title: "Article deleted" });
          onClose();
        }}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
});
