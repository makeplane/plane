/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent, ReactNode } from "react";
import { Button } from "@makeplane/propel/components/button";
import { cn } from "@plane/utils";

export type CommentBoxProps = {
  /** The rich-text editor. */
  editor: ReactNode;
  /** Formatting controls (a Propel `Toolbar`) shown in the footer, left of the submit button. */
  toolbar?: ReactNode;
  submitLabel: string;
  onSubmit: () => void;
  /** Whether the current content can be submitted (non-empty, uploads settled…). */
  canSubmit: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
  className?: string;
};

// Keep focus (and the selection) in the editor when the submit button is pressed.
const preserveEditorFocus = (event: MouseEvent) => event.preventDefault();

/**
 * Chrome for a comment composer: a bordered surface with the editor on top and a footer row holding
 * the formatting toolbar and the submit button. It owns no content state — the editor and its
 * submit rules stay with the caller.
 */
export function CommentBox(props: CommentBoxProps) {
  const {
    editor,
    toolbar,
    submitLabel,
    onSubmit,
    canSubmit,
    isSubmitting = false,
    disabled = false,
    className,
  } = props;

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl border border-subtle-1 bg-layer-2 transition-[background-color,border-color,box-shadow]",
        "hover:border-strong hover:bg-layer-2-hover",
        "focus-within:border-accent-strong focus-within:bg-layer-2-hover focus-within:ring-2 focus-within:ring-accent-strong/20 focus-within:hover:border-accent-strong",
        className
      )}
    >
      <div className="flex min-h-16 w-full items-start p-3">{editor}</div>
      <div className="flex min-h-9 w-full items-center justify-between gap-2 pr-1.5 pl-1">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          stretch="auto"
          label={submitLabel}
          onMouseDown={preserveEditorFocus}
          onClick={onSubmit}
          disabled={disabled || isSubmitting || !canSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
}
