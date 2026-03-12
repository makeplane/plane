/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ThumbsUp, Minus, ThumbsDown, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueOpinion, TOpinionSentiment } from "@plane/types";
import { cn } from "@plane/utils";
import { useOpinion } from "@/plane-web/hooks/store/use-opinion";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityId: string;
  existingOpinion?: TIssueOpinion;
  onClose: () => void;
};

const SENTIMENTS: {
  value: TOpinionSentiment;
  labelKey: string;
  Icon: React.FC<{ className?: string }>;
  activeClass: string;
}[] = [
  {
    value: "approve",
    labelKey: "opinion.approve",
    Icon: ThumbsUp,
    activeClass: "bg-green-500/10 text-green-600 border-green-500/40",
  },
  {
    value: "neutral",
    labelKey: "opinion.neutral",
    Icon: Minus,
    activeClass: "bg-surface-2 text-color-secondary border-color-primary",
  },
  {
    value: "reject",
    labelKey: "opinion.reject",
    Icon: ThumbsDown,
    activeClass: "bg-red-500/10 text-red-600 border-red-500/40",
  },
];

export const OpinionPopover = observer(function OpinionPopover(props: Props) {
  const { workspaceSlug, projectId, issueId, activityId, existingOpinion, onClose } = props;
  const { t } = useTranslation();
  const store = useOpinion();

  const [sentiment, setSentiment] = useState<TOpinionSentiment>(existingOpinion?.sentiment ?? "neutral");
  const [content, setContent] = useState(existingOpinion?.content ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await store.upsertOpinion(workspaceSlug, projectId, issueId, activityId, { sentiment, content });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("opinion.saved"), message: t("opinion.saved_successfully") });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error"), message: t("opinion.save_failed") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingOpinion) return;
    setSubmitting(true);
    try {
      await store.deleteOpinion(workspaceSlug, projectId, issueId, activityId, existingOpinion.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("opinion.deleted"), message: t("opinion.deleted_successfully") });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error"), message: t("opinion.delete_failed") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border border-color-primary bg-surface-1 p-3 shadow-xl">
      {/* Sentiment buttons */}
      <div className="flex items-center gap-1.5 mb-2">
        {SENTIMENTS.map(({ value, labelKey, Icon, activeClass }) => (
          <button
            key={value}
            type="button"
            onClick={() => setSentiment(value)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
              "border-color-subtle text-color-tertiary hover:bg-surface-2",
              sentiment === value && activeClass
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Note input */}
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t("opinion.content_placeholder")}
        className="w-full rounded-md border border-color-subtle bg-layer-2 px-2.5 py-1.5 text-xs text-color-primary placeholder:text-color-tertiary outline-none focus:border-color-primary mb-2"
      />

      {/* Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="rounded-md bg-surface-2 px-3 py-1 text-xs font-medium text-color-primary hover:bg-layer-3 disabled:opacity-50"
          >
            {submitting ? t("common.saving") : t("common.save")}
          </button>
          {existingOpinion && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleDelete()}
              className="rounded-md px-2 py-1 text-xs text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              {t("delete")}
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-color-tertiary hover:text-color-secondary">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
});
