/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// local imports
import type { TChecklistOperations } from "../../issue-detail-widgets/checklist/helper";

type Props = {
  issueId: string;
  checklistOperations: TChecklistOperations;
  disabled?: boolean;
  issueServiceType: TIssueServiceType;
};

// Always mounted at the bottom of the list — the whole point of this
// feature is that adding a step costs nothing more than typing and
// pressing Enter, never a modal. See research.md D11.
export const ChecklistAddItem = observer(function ChecklistAddItem(props: Props) {
  const { issueId, checklistOperations, disabled = false, issueServiceType } = props;
  // translation
  const { t } = useTranslation();
  // store hooks
  const {
    checklist: { isAddingChecklistItem },
    stopAddingChecklistItem,
  } = useIssueDetail(issueServiceType);
  // state
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus when the "Add checklist item" action button is clicked, whether
  // this component just mounted (zero-item case) or was already on screen.
  const shouldFocus = isAddingChecklistItem(issueId);
  useEffect(() => {
    if (shouldFocus) inputRef.current?.focus();
  }, [shouldFocus]);

  const submit = async () => {
    const name = value.trim();
    if (!name || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await checklistOperations.create({ name });
      setValue("");
      // Keep focus so consecutive items can be typed without re-engaging
      // the input (spec FR-002, SC-001).
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setValue("");
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    if (value.trim()) {
      submit();
    } else {
      // Backed out without typing anything — let the zero-item render gate
      // in issue-detail-widget-collapsibles.tsx close the section again
      // (spec US1 acceptance scenario 6).
      stopAddingChecklistItem(issueId);
    }
  };

  if (disabled) return null;

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={t("checklist.placeholder")}
      className="w-full rounded-sm border border-transparent bg-transparent px-2 py-1.5 text-13 text-primary outline-none placeholder:text-placeholder focus:border-subtle focus:bg-surface-2"
    />
  );
});
