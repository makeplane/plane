/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Classes that turn a property trigger into an invisible layer over whatever shows its value. */
export const PROPERTY_EDITOR_OVERLAY_CLASSNAME = "absolute inset-0 size-full max-w-none rounded-none opacity-0";

/** Props that turn a property select into its editor in a row's "+N" Properties menu. */
export type TPropertyEditorProps = { className?: string; tooltip?: boolean; onClose?: () => void };

/** The date-picker counterpart of {@link TPropertyEditorProps}. */
export type TDatePropertyEditorProps = {
  className?: string;
  clearable?: boolean;
  showTooltip?: boolean;
  onClose?: () => void;
  side?: "left";
  align?: "start";
};

/** The select's trigger stretched invisibly over the menu row, reporting its close to the menu. */
export const getPropertyEditorProps = (onClose: () => void): TPropertyEditorProps => ({
  className: PROPERTY_EDITOR_OVERLAY_CLASSNAME,
  tooltip: false,
  onClose,
});

/**
 * Same for a date picker: its calendar opens beside the menu, and the clear button (hidden under
 * the invisible trigger) is dropped so a press on the row can't clear the date by accident.
 */
export const getDatePropertyEditorProps = (onClose: () => void): TDatePropertyEditorProps => ({
  className: PROPERTY_EDITOR_OVERLAY_CLASSNAME,
  clearable: false,
  showTooltip: false,
  onClose,
  side: "left",
  align: "start",
});
