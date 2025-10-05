import React from "react";

/**
 * Formats a shortcut string for display
 * Converts "cmd+shift+," to proper keyboard symbols
 */
export const formatShortcutForDisplay = (shortcut: string | undefined): string | null => {
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
};

export const ShortcutBadge = ({ shortcut }: { shortcut: string | undefined }) => {
  if (!shortcut) return null;

  const formatted = formatShortcutForDisplay(shortcut);

  return (
    <div className="pointer-events-none inline-flex items-center gap-1 select-none font-medium">
      {formatted?.split("").map((char, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 items-center justify-center rounded border border-custom-border-300 bg-custom-background-100 px-1.5 font-mono text-[10px] font-medium text-custom-text-300">
            {char.toUpperCase()}
          </kbd>
        </React.Fragment>
      ))}
    </div>
  );
};

/**
 * Formats key sequence for display (e.g., "gm" -> "G then M")
 */
export const formatKeySequenceForDisplay = (sequence: string | undefined): string => {
  if (!sequence) return "";

  const chars = sequence.split("");
  return chars.map((c) => c.toUpperCase()).join(" then ");
};

export const KeySequenceBadge = ({ sequence }: { sequence: string | undefined }) => {
  if (!sequence) return null;

  const chars = sequence.split("");

  return (
    <div className="pointer-events-none inline-flex items-center gap-1 select-none font-medium">
      {chars.map((char, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex h-5 items-center justify-center rounded border border-custom-border-300 bg-custom-background-100 px-1.5 font-mono text-[10px] font-medium text-custom-text-300">
            {char.toUpperCase()}
          </kbd>
          {index < chars.length - 1 && <span className="text-[10px] text-custom-text-400">then</span>}
        </React.Fragment>
      ))}
    </div>
  );
};
