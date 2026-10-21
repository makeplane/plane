/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AddOutline } from "@makeplane/propel/icons";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";

type Props = {
  parentIssue: TIssue;
  spacingLeft: number;
  onClose: () => void;
};

/**
 * d2m-plane: inline row to quickly add sub-work items under a parent in the list layout.
 * Enter creates the item and keeps the row open for the next one; Esc (or blurring an empty row) closes it.
 * Uses the layout's createIssue action, so in a sprint / module view the new item lands in that sprint / module.
 */
export const QuickAddSubIssue = observer(function QuickAddSubIssue(props: Props) {
  const { parentIssue, spacingLeft, onClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
  const { t } = useTranslation();
  const storeType = useIssueStoreType();
  const { createIssue } = useIssuesActions(storeType);
  const {
    subIssues: { fetchSubIssues },
  } = useIssueDetail();
  // states
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting || !createIssue || !parentIssue.project_id || !workspaceSlug) return;
    setIsSubmitting(true);
    try {
      await createIssue(parentIssue.project_id, {
        name: trimmedName,
        parent_id: parentIssue.id,
        project_id: parentIssue.project_id,
      });
      await fetchSubIssues(workspaceSlug.toString(), parentIssue.project_id, parentIssue.id);
      setName("");
    } catch {
      setToast({ type: "error", title: "Error!", message: t("d2m_quick_actions.create_failed") });
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex min-h-11 items-center gap-2 border-b border-b-subtle bg-layer-transparent py-2 pr-4 pl-page-x">
      <div className="flex w-full items-center gap-1" style={{ marginLeft: `${spacingLeft + 12}px` }}>
        <div className="grid size-7 flex-shrink-0 place-items-center">
          <AddOutline className="size-4 text-placeholder" />
        </div>
        <input
          ref={inputRef}
          // oxlint-disable-next-line jsx_a11y/no-autofocus
          autoFocus
          type="text"
          value={name}
          disabled={isSubmitting}
          placeholder={t("d2m_quick_actions.sub_issue_placeholder")}
          aria-label={t("d2m_quick_actions.add_sub_issue")}
          className="w-full min-w-0 bg-transparent text-body-xs-medium text-primary outline-none placeholder:text-placeholder"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onClose();
            }
          }}
          onBlur={() => {
            if (!name.trim() && !isSubmitting) onClose();
          }}
        />
      </div>
    </div>
  );
});
