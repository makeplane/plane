/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { observer } from "mobx-react";
// plane imports
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { cn } from "@plane/utils";
// components
import { LabelSelect } from "@/components/dropdowns/label/label-select";

export interface IIssuePropertyLabels {
  projectId: string | null;
  value: string[] | null;
  /** @deprecated The binding resolves labels from the label store; kept so existing callers compile. */
  defaultOptions?: unknown;
  onChange: (data: string[]) => void;
  disabled?: boolean;
  /** @deprecated The pill and table-cell triggers carry no dropdown arrow. */
  hideDropdownArrow?: boolean;
  className?: string;
  /** @deprecated Trigger chrome comes from the Select variant. */
  buttonClassName?: string;
  /** @deprecated The Select popup sizes itself. */
  optionsClassName?: string;
  /** @deprecated The Select popup positions itself below the trigger and flips on collision. */
  placement?: TPopoverMenuPlacement;
  /** @deprecated The trigger shows the name of a single label and a count for several. */
  maxRender?: number;
  noLabelBorder?: boolean;
  placeholderText?: string;
  onClose?: () => void;
  /** @deprecated The Select renders its trigger eagerly. */
  renderByDefault?: boolean;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

/**
 * Stops a click on the picker from reaching the clickable row or link the property sits in, as the
 * legacy label dropdown's wrapper did.
 */
const swallowEvent = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

/**
 * Label property of a work item row (list, kanban, draft, spreadsheet). Adapter over the
 * `LabelSelect` binding: a borderless full-width cell renders as a table cell, everything else as a
 * small pill (EE `LabelsChip`).
 */
export const IssuePropertyLabels = observer(function IssuePropertyLabels(props: IIssuePropertyLabels) {
  const {
    projectId,
    value,
    onChange,
    onClose,
    disabled,
    className,
    noLabelBorder = false,
    placeholderText,
    fullWidth = false,
    fullHeight = false,
  } = props;

  const isTableCell = fullWidth && noLabelBorder;

  return (
    <div
      role="presentation"
      className={cn(fullHeight ? "h-full" : "h-5", { "w-full": fullWidth }, className)}
      onClick={swallowEvent}
    >
      <LabelSelect
        projectId={projectId}
        value={value ?? []}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholderText}
        onClose={onClose}
        variant={isTableCell ? "table-cell" : "pill-sm"}
        // `.clickable` is what the spreadsheet's keyboard navigation clicks on Enter / Space in a focused cell.
        className={isTableCell ? "clickable" : undefined}
        tooltip
      />
    </div>
  );
});
