/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";

/** How a property is listed in the "+N" Properties menu once its chip no longer fits the row. */
export type WorkItemPropertyMenuRow = {
  /** Leading 16px icon — the same glyph family the property's chip uses. */
  icon: ReactNode;
  /** Translated property name, e.g. "Due date". */
  label: string;
  /** Short, muted value summary shown at the row end (a name, a date, a count, or "None"). */
  preview?: ReactNode;
  /**
   * Renders the property's own editor as an invisible trigger stretched over the menu row, so
   * picking the row opens the same dropdown the chip opens. The editor MUST call `onEditorClose`
   * from its own `onClose` — the menu stays open while an editor is, and needs to hear it close.
   */
  editor?: (helpers: { onEditorClose: () => void }) => ReactNode;
  /** Action rows with no editor (e.g. counts that open the work item). Ignored when `editor` is set. */
  onSelect?: () => void;
  /** Read-only: the row still shows its preview but cannot be picked. */
  disabled?: boolean;
};

/** One rendering of a property that can shrink, e.g. "3 label pills" vs. "4 labels". */
export type WorkItemPropertyVariant = {
  /** Stable id within the entry. */
  id: string;
  /** Estimated width in px (computed off-DOM); replaced by the measured width once it renders. */
  widthPx: number;
  chip: ReactNode;
};

/** A property chip in a work item row, with what the row needs to fit or collapse it. */
export type WorkItemPropertyEntry = {
  /** Stable key — usually the display-property key. */
  key: string;
  /** Lower stays visible longer; the highest values collapse into the menu first. Ties keep row order. */
  hidePriority: number;
  /** The chip as rendered in the row. Must render something — gate the entry out instead of rendering null. */
  chip: ReactNode;
  menuRow: WorkItemPropertyMenuRow;
  /**
   * Optional shrinking renderings, richest first. When present the row picks the richest one that
   * fits, and `chip` is only used if none of them can be resolved.
   */
  variants?: WorkItemPropertyVariant[];
  /**
   * Changes whenever the chip's content (and so its width) changes, e.g. the selected value's name.
   * A cached width is only reused while this stays the same.
   */
  measureKey?: string;
};
