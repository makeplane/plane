import React from "react";

/**
 * Formats a shortcut string for display
 * Converts "cmd+shift+," to proper keyboard symbols
 */
export function formatShortcutForDisplay(shortcut: string | undefined): React.ReactNode {
  if (!shortcut) return null;

  const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const parts = shortcut.split("+").map((part) => {
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

  return parts.join("");
}

/**
 * Renders a shortcut badge component
 */
export function ShortcutBadge({ shortcut }: { shortcut: string | undefined }) {
  if (!shortcut) return null;

  const formatted = formatShortcutForDisplay(shortcut);

  return (
    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-custom-border-200 bg-custom-background-90 px-1.5 font-mono text-[10px] font-medium text-custom-text-300 opacity-100">
      {formatted}
    </kbd>
  );
}

/**
 * Formats key sequence for display (e.g., "gm" -> "G then M")
 */
export function formatKeySequenceForDisplay(sequence: string | undefined): string {
  if (!sequence) return "";

  const chars = sequence.split("");
  return chars.map((c) => c.toUpperCase()).join(" then ");
}

/**
 * Renders a key sequence badge
 */
export function KeySequenceBadge({ sequence }: { sequence: string | undefined }) {
  if (!sequence) return null;

  const chars = sequence.split("");

  return (
    <div className="pointer-events-none inline-flex select-none items-center gap-1">
      {chars.map((char, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 items-center justify-center rounded border border-custom-border-200 bg-custom-background-90 px-1.5 font-mono text-[10px] font-medium text-custom-text-300">
            {char.toUpperCase()}
          </kbd>
          {index < chars.length - 1 && <span className="text-[10px] text-custom-text-400">then</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
