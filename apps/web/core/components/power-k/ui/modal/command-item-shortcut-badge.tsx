/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React from "react";
import { BackspaceIcon, CommandIcon, ShiftIcon } from "@plane/propel/icons";

type TShortcutPart = { type: "text"; value: string } | { type: "icon"; component: React.FC<{ className?: string }> };

const KEY_DISPLAY_MAP: Record<string, { text: string; macText?: string; macIcon?: React.FC<{ className?: string }> }> =
  {
    cmd: { text: "Ctrl", macIcon: CommandIcon },
    meta: { text: "Ctrl", macIcon: CommandIcon },
    ctrl: { text: "Ctrl", macText: "⌃" },
    alt: { text: "Alt", macText: "⌥" },
    option: { text: "Alt", macText: "⌥" },
    shift: { text: "Shift", macIcon: ShiftIcon },
    delete: { text: "⌫", macIcon: BackspaceIcon },
    backspace: { text: "⌫", macIcon: BackspaceIcon },
    enter: { text: "↵" },
    return: { text: "↵" },
    space: { text: "Space" },
    escape: { text: "Esc" },
    esc: { text: "Esc" },
    tab: { text: "Tab" },
    arrowup: { text: "↑" },
    up: { text: "↑" },
    arrowdown: { text: "↓" },
    down: { text: "↓" },
    arrowleft: { text: "←" },
    left: { text: "←" },
    arrowright: { text: "→" },
    right: { text: "→" },
  };

const getIsMac = () => typeof window !== "undefined" && navigator.userAgent.indexOf("Mac") !== -1;

const getShortcutParts = (shortcut: string): TShortcutPart[] => {
  const isMac = getIsMac();
  return shortcut.split("+").map((part) => {
    const entry = KEY_DISPLAY_MAP[part.toLowerCase().trim()];
    if (!entry) return { type: "text", value: part.toUpperCase() };
    if (isMac && entry.macIcon) return { type: "icon", component: entry.macIcon };
    return { type: "text", value: (isMac && entry.macText) || entry.text };
  });
};

export function ShortcutBadge({ shortcut }: { shortcut: string | undefined }) {
  if (!shortcut) return null;

  const parts = getShortcutParts(shortcut);

  return (
    <div className="shrink-0 pointer-events-none inline-flex items-center gap-1 select-none font-medium">
      {parts.map((part, index) => (
        <kbd
          key={index}
          className="inline-flex h-5 items-center justify-center rounded-sm border border-strong bg-surface-1 px-1.5 font-code text-10 font-medium text-tertiary"
        >
          {part.type === "icon" ? <part.component className="size-3" /> : part.value}
        </kbd>
      ))}
    </div>
  );
}

export function KeySequenceBadge({ sequence }: { sequence: string | undefined }) {
  if (!sequence) return null;

  const chars = sequence.split("");

  return (
    <div className="shrink-0 pointer-events-none inline-flex items-center gap-1 select-none font-medium">
      {chars.map((char, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 items-center justify-center rounded-sm border border-strong bg-surface-1 px-1.5 font-code text-10 font-medium text-tertiary">
            {char.toUpperCase()}
          </kbd>
          {index < chars.length - 1 && <span className="text-10 text-placeholder">then</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
