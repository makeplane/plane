/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { cn } from "../utils";
import type { AISlashCommand, AITextareaProps } from "./helper";

function CommandMenu({
  commands,
  filter,
  onSelect,
}: {
  commands: AISlashCommand[];
  filter: string;
  onSelect: (cmd: AISlashCommand) => void;
}) {
  const filtered = filter
    ? commands.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()) || c.label.toLowerCase().includes(filter.toLowerCase())
      )
    : commands;

  if (filtered.length === 0) return null;

  return (
    <div
      role="listbox"
      aria-label="Slash commands"
      className="shadow-md absolute bottom-full left-0 z-20 mb-1 w-full min-w-48 overflow-hidden rounded-md border border-subtle bg-layer-3"
    >
      {filtered.map((cmd) => (
        <button
          key={cmd.name}
          role="option"
          aria-selected={false}
          type="button"
          className="hover:bg-layer-4 focus:bg-layer-4 flex w-full items-center gap-2 px-3 py-2 text-left text-13 text-primary transition-colors focus:outline-none"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(cmd);
          }}
        >
          {cmd.icon && <span className="size-4 shrink-0 text-secondary">{cmd.icon}</span>}
          <span className="font-medium">/{cmd.name}</span>
          {cmd.description && <span className="ml-auto truncate text-11 text-tertiary">{cmd.description}</span>}
        </button>
      ))}
    </div>
  );
}

const AITextarea = React.forwardRef(function AITextarea(
  props: AITextareaProps,
  ref: React.ForwardedRef<HTMLTextAreaElement>
) {
  const {
    mode = "primary",
    hasError = false,
    commands = [],
    onCommand,
    onChange,
    onKeyDown,
    className,
    ...rest
  } = props;

  const [showCommands, setShowCommands] = React.useState(false);
  const [commandFilter, setCommandFilter] = React.useState("");
  const internalRef = React.useRef<HTMLTextAreaElement>(null);
  const composedRef = (node: HTMLTextAreaElement | null) => {
    (internalRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
  };

  const detectSlashCommand = (value: string, cursorPos: number) => {
    if (commands.length === 0) return;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastNewline = textBeforeCursor.lastIndexOf("\n");
    const currentLine = textBeforeCursor.slice(lastNewline + 1);

    if (currentLine.startsWith("/")) {
      setShowCommands(true);
      setCommandFilter(currentLine.slice(1));
    } else {
      setShowCommands(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    detectSlashCommand(e.target.value, e.target.selectionStart ?? e.target.value.length);
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && showCommands) {
      setShowCommands(false);
    }
    onKeyDown?.(e);
  };

  const handleSelectCommand = (cmd: AISlashCommand) => {
    const textarea = internalRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const pos = textarea.selectionStart ?? value.length;
    const lastNewline = value.lastIndexOf("\n", pos - 1);
    const lineStart = lastNewline + 1;
    const newValue = value.slice(0, lineStart) + value.slice(pos);

    onChange?.(newValue);
    onCommand?.(cmd);
    setShowCommands(false);
  };

  return (
    <div className="relative w-full">
      {showCommands && commands.length > 0 && (
        <CommandMenu commands={commands} filter={commandFilter} onSelect={handleSelectCommand} />
      )}
      <textarea
        ref={composedRef}
        className={cn(
          "placeholder-tertiary block w-full rounded-md border border-subtle-1 bg-layer-2 text-13 text-primary focus:ring-1 focus:ring-accent-strong focus:outline-none",
          {
            "border-xs px-3 py-2": mode === "primary",
            "border-none bg-transparent px-0 py-1 ring-0": mode === "transparent",
            "border-danger-strong": hasError,
          },
          className
        )}
        aria-invalid={hasError || undefined}
        autoComplete="off"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...rest}
      />
      {commands.length > 0 && (
        <div className="mt-1 text-11 text-tertiary">
          Type <kbd className="font-mono rounded border border-subtle bg-layer-2 px-1">/</kbd> for commands
        </div>
      )}
    </div>
  );
});

AITextarea.displayName = "ai-textarea";

export { AITextarea };
