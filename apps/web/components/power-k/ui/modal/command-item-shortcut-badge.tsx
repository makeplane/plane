/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane imports
import { ArrowBlockUpOutline, CommandOutline, DeleteArrowOutline } from "@makeplane/propel/icons";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

/**
 * Formats a shortcut string for display, one label per key
 * e.g. "cmd+shift+," -> ["⌘", "⇧", ","] on Mac, ["Ctrl", "Shift", ","] elsewhere
 */
export const formatShortcutForDisplay = (shortcut: string | undefined, isMac: boolean): string[] => {
  if (!shortcut) return [];

  return shortcut.split("+").map((part) => {
    const lower = part.toLowerCase().trim();

    // Map to proper symbols
    switch (lower) {
      case "cmd":
      case "meta":
        return isMac ? "⌘" : "Ctrl";
      case "ctrl":
        return isMac ? "⌃" : "Ctrl";
      case "alt":
      case "option":
        return isMac ? "⌥" : "Alt";
      case "shift":
        return isMac ? "⇧" : "Shift";
      case "delete":
      case "backspace":
        return "⌫";
      case "enter":
      case "return":
        return "↵";
      case "space":
        return "Space";
      case "escape":
      case "esc":
        return "Esc";
      case "tab":
        return "Tab";
      case "arrowup":
      case "up":
        return "↑";
      case "arrowdown":
      case "down":
        return "↓";
      case "arrowleft":
      case "left":
        return "←";
      case "arrowright":
      case "right":
        return "→";
      case ",":
        return ",";
      case ".":
        return ".";
      default:
        return part.toUpperCase();
    }
  });
};

/** Mac modifier glyphs drawn as icons; the glyph stays as screen-reader text. */
const MAC_KEY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "⌘": CommandOutline,
  "⇧": ArrowBlockUpOutline,
  "⌫": DeleteArrowOutline,
};

export function ShortcutBadge({ shortcut }: { shortcut: string | undefined }) {
  const { platform } = usePlatformOS();
  const isMac = platform === "MacOS";
  const labels = formatShortcutForDisplay(shortcut, isMac);
  if (labels.length === 0) return null;

  return (
    <div className="pointer-events-none inline-flex shrink-0 items-center gap-1 font-medium select-none">
      {labels.map((label, index) => {
        const KeyIcon = isMac ? MAC_KEY_ICONS[label] : undefined;
        return (
          <kbd
            // oxlint-disable-next-line react/no-array-index-key -- static list from a constant string, never reordered
            key={index}
            className="inline-flex h-5 items-center justify-center rounded-sm border border-strong bg-surface-1 px-1.5 font-code text-caption-xs-medium text-tertiary"
          >
            {KeyIcon ? (
              <>
                <KeyIcon className="size-3" />
                <span className="sr-only">{label}</span>
              </>
            ) : (
              label
            )}
          </kbd>
        );
      })}
    </div>
  );
}

type TKeySequenceBadgeProps = {
  sequence: string | undefined;
  /** Translated connector rendered between keys, e.g. "then" in "G then M" */
  separator: string;
};

export function KeySequenceBadge({ sequence, separator }: TKeySequenceBadgeProps) {
  if (!sequence) return null;

  const chars = sequence.split("");

  return (
    <div className="pointer-events-none inline-flex shrink-0 items-center gap-1 font-medium select-none">
      {chars.map((char, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- static list from a constant string, never reordered
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 items-center justify-center rounded-sm border border-strong bg-surface-1 px-1.5 font-code text-caption-xs-medium text-tertiary">
            {char.toUpperCase()}
          </kbd>
          {index < chars.length - 1 && <span className="text-caption-xs-medium text-placeholder">{separator}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
