/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
import { AddOutline, CloseOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";

/**
 * d2m-plane: "Add child" section of the create work item modal. The typed names are created as
 * sub-work items of the new work item right after it is saved (see `base.tsx`).
 * Enter in a row adds the next row; Backspace on an empty row removes it.
 */
export const ChildWorkItemsInput = observer(function ChildWorkItemsInput() {
  const { t } = useTranslation();
  const { childWorkItemNames, setChildWorkItemNames } = useIssueModal();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusRow = (index: number) => requestAnimationFrame(() => inputRefs.current[index]?.focus());

  const addRow = (afterIndex?: number) => {
    const insertAt = afterIndex === undefined ? childWorkItemNames.length : afterIndex + 1;
    setChildWorkItemNames((prev) => [...prev.slice(0, insertAt), "", ...prev.slice(insertAt)]);
    focusRow(insertAt);
  };

  const removeRow = (index: number) => {
    setChildWorkItemNames((prev) => prev.filter((_, i) => i !== index));
    focusRow(Math.max(0, index - 1));
  };

  return (
    <div className="flex flex-col gap-1 px-5 pb-3">
      {childWorkItemNames.map((name, index) => (
        <div key={index} className="flex items-center gap-2 rounded-md border border-subtle px-2 py-1">
          <span className="size-1.5 flex-shrink-0 rounded-full bg-layer-3" aria-hidden />
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            value={name}
            placeholder={t("d2m_quick_actions.child_placeholder")}
            aria-label={t("d2m_quick_actions.child_placeholder")}
            className="w-full min-w-0 bg-transparent text-body-xs-regular text-primary outline-none placeholder:text-placeholder"
            onChange={(e) => {
              const value = e.target.value;
              setChildWorkItemNames((prev) => prev.map((item, i) => (i === index ? value : item)));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // don't submit the whole form — add the next child row instead
                e.preventDefault();
                e.stopPropagation();
                if (name.trim()) addRow(index);
              } else if (e.key === "Backspace" && name === "") {
                e.preventDefault();
                removeRow(index);
              }
            }}
          />
          <button
            type="button"
            aria-label={t("d2m_quick_actions.remove_child")}
            className="grid size-5 flex-shrink-0 place-items-center rounded-sm text-placeholder hover:bg-layer-transparent-hover hover:text-primary"
            onClick={() => removeRow(index)}
          >
            <CloseOutline className="size-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-body-xs-medium text-secondary hover:bg-layer-transparent-hover hover:text-primary"
        onClick={() => addRow()}
      >
        <AddOutline className="size-3.5" />
        {t("d2m_quick_actions.add_child")}
      </button>
    </div>
  );
});
