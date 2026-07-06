/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import type { ComponentType } from "react";
import { Bold, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  html: string;
  placeholder?: string;
  onChange: (value: { html: string; text: string }) => void;
  className?: string;
};

type ToolButton = {
  icon: ComponentType<{ className?: string }>;
  command: string;
  titleKey: string;
  prompt?: boolean;
};

const TOOL_BUTTONS: ToolButton[] = [
  { icon: Bold, command: "bold", titleKey: "mail.compose.toolbar.bold" },
  { icon: Italic, command: "italic", titleKey: "mail.compose.toolbar.italic" },
  { icon: Underline, command: "underline", titleKey: "mail.compose.toolbar.underline" },
  { icon: List, command: "insertUnorderedList", titleKey: "mail.compose.toolbar.bullet_list" },
  { icon: ListOrdered, command: "insertOrderedList", titleKey: "mail.compose.toolbar.numbered_list" },
  { icon: Link2, command: "createLink", titleKey: "mail.compose.toolbar.link", prompt: true },
];

export function MailRichText(props: Props) {
  const { html, placeholder, onChange, className } = props;
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync external changes (template insert, reset) without disturbing the caret
  // while typing: onInput already pushes innerHTML up, so value === innerHTML
  // during normal editing and this effect is a no-op then.
  useEffect(() => {
    const node = editorRef.current;
    if (node && node.innerHTML !== (html ?? "")) {
      node.innerHTML = html ?? "";
    }
  }, [html]);

  const emit = () => {
    const node = editorRef.current;
    if (node) onChange({ html: node.innerHTML, text: node.innerText });
  };

  const runCommand = (button: ToolButton) => {
    editorRef.current?.focus();
    if (button.prompt) {
      const url = window.prompt("URL");
      if (!url) return;
      document.execCommand(button.command, false, url);
    } else {
      document.execCommand(button.command);
    }
    emit();
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex items-center gap-0.5 border-b border-[var(--mail-border)] px-2 py-1.5">
        {TOOL_BUTTONS.map((button) => (
          <button
            key={button.command}
            type="button"
            title={t(button.titleKey)}
            className="grid size-8 place-items-center rounded text-[var(--mail-muted)] hover:bg-[var(--mail-hover)] hover:text-[var(--mail-ink)]"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(button)}
          >
            <button.icon className="size-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        className="mail-message-body mail-compose-editor min-h-0 flex-1 overflow-y-auto px-4 py-4 text-sm leading-7 outline-none"
        onInput={emit}
        onBlur={emit}
      />
    </div>
  );
}
