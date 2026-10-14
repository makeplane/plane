/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IPowerKCommandRegistry } from "./registry";
import type { TPowerKCommandConfig, TPowerKContext } from "./types";

/** `KeyboardEvent.code` -> unshifted character on the active OS keyboard layout */
export type TKeyboardLayoutMap = ReadonlyMap<string, string>;

type TNavigatorWithKeyboard = Navigator & {
  keyboard?: { getLayoutMap?: () => Promise<TKeyboardLayoutMap> };
};

/**
 * Reads the active keyboard layout where the browser exposes it (Chromium, secure top-level
 * contexts). Resolves to null elsewhere, in which case matching falls back to the US layout.
 */
export async function loadKeyboardLayoutMap(): Promise<TKeyboardLayoutMap | null> {
  if (typeof navigator === "undefined") return null;
  const keyboard = (navigator as TNavigatorWithKeyboard).keyboard;
  if (typeof keyboard?.getLayoutMap !== "function") return null;
  try {
    return await keyboard.getLayoutMap();
  } catch {
    return null;
  }
}

/**
 * US layout: the base character under each shifted glyph and the physical key it lives on.
 * Used only without a layout map, and only when `e.code` agrees, so a layout that puts a
 * different character on that key can never fire a shortcut it does not advertise.
 */
const US_SHIFTED_GLYPHS: Record<string, { base: string; code: string }> = {
  "~": { base: "`", code: "Backquote" },
  "!": { base: "1", code: "Digit1" },
  "@": { base: "2", code: "Digit2" },
  "#": { base: "3", code: "Digit3" },
  $: { base: "4", code: "Digit4" },
  "%": { base: "5", code: "Digit5" },
  "^": { base: "6", code: "Digit6" },
  "&": { base: "7", code: "Digit7" },
  "*": { base: "8", code: "Digit8" },
  "(": { base: "9", code: "Digit9" },
  ")": { base: "0", code: "Digit0" },
  _: { base: "-", code: "Minus" },
  "+": { base: "=", code: "Equal" },
  "{": { base: "[", code: "BracketLeft" },
  "}": { base: "]", code: "BracketRight" },
  "|": { base: "\\", code: "Backslash" },
  ":": { base: ";", code: "Semicolon" },
  '"': { base: "'", code: "Quote" },
  "<": { base: ",", code: "Comma" },
  ">": { base: ".", code: "Period" },
  "?": { base: "/", code: "Slash" },
};

const isAsciiPrintable = (char: string): boolean => char >= " " && char <= "~";

/** Letter or digit printed on a physical key in the US layout ("KeyB" -> "b", "Digit2" -> "2") */
const usKeyForCode = (code: string): string | undefined => {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) return letter[1].toLowerCase();
  const digit = /^Digit([0-9])$/.exec(code);
  if (digit) return digit[1];
  return undefined;
};

/**
 * The layout-independent key a shortcut is registered against: the unshifted character on the
 * pressed physical key ("," for Shift+Comma), lowercased; named keys ("backspace") as-is.
 * Non-Latin layouts resolve letters and digits by physical position, as browsers do for
 * their own shortcuts, so Cmd+B still toggles the sidebar on a Cyrillic or Greek layout.
 */
export function resolveShortcutKey(e: KeyboardEvent, layoutMap: TKeyboardLayoutMap | null): string {
  if (e.key === " ") return "space";
  if (e.key.length !== 1) return e.key.toLowerCase();

  const fromLayout = e.code ? layoutMap?.get(e.code) : undefined;
  if (fromLayout) return isAsciiPrintable(fromLayout) ? fromLayout.toLowerCase() : (usKeyForCode(e.code) ?? fromLayout);

  const key = e.key.toLowerCase();
  if (!isAsciiPrintable(key)) return usKeyForCode(e.code) ?? key;
  if (!e.shiftKey) return key;
  const shifted = US_SHIFTED_GLYPHS[e.key];
  return shifted && shifted.code === e.code ? shifted.base : key;
}

/**
 * Formats a keyboard event into a modifier shortcut string
 * e.g., "cmd+k", "cmd+shift+,", "cmd+backspace"
 */
export function formatModifierShortcut(e: KeyboardEvent, layoutMap: TKeyboardLayoutMap | null): string {
  const parts: string[] = [];

  if (e.ctrlKey || e.metaKey) parts.push("cmd");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  parts.push(resolveShortcutKey(e, layoutMap));

  return parts.join("+");
}

/** ARIA roles whose keyboard handling (typing, typeahead) must win over global shortcuts */
const TYPING_ROLES = new Set([
  "textbox",
  "searchbox",
  "combobox",
  "spinbutton",
  "listbox",
  "option",
  "menu",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
]);

/** Overlays and editors that own keyboard input while focus is inside them */
const KEYBOARD_OWNING_ANCESTOR = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], .ProseMirror';

/**
 * Whether keystrokes on this target belong to a widget: form controls, editable content
 * (including `plaintext-only` and inherited editability), and ARIA widgets or overlays with
 * their own keyboard handling. Global shortcuts neither fire from nor linger across them.
 */
export function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;

  const role = target.getAttribute("role");
  if (role && TYPING_ROLES.has(role)) return true;

  return target.closest(KEYBOARD_OWNING_ANCESTOR) !== null;
}

/** Whether any registered sequence starts with `prefix` (equality included) */
const hasSequencePrefix = (sequenceMap: ReadonlyMap<string, string>, prefix: string): boolean => {
  for (const sequence of sequenceMap.keys()) {
    if (sequence.startsWith(prefix)) return true;
  }
  return false;
};

/**
 * Global shortcut handler
 * Handles all keyboard shortcuts: single keys, sequences, and modifiers
 */
export class ShortcutHandler {
  private sequence = "";
  private sequenceTimeout: number | null = null;
  private registry: IPowerKCommandRegistry;
  private getContext: () => TPowerKContext;
  private openPalette: () => void;
  private togglePalette: () => void;
  private layoutMap: TKeyboardLayoutMap | null = null;
  private isEnabled = true;

  constructor(
    registry: IPowerKCommandRegistry,
    getContext: () => TPowerKContext,
    openPalette: () => void,
    togglePalette: () => void
  ) {
    this.registry = registry;
    this.getContext = getContext;
    this.openPalette = openPalette;
    this.togglePalette = togglePalette;
    void this.loadLayoutMap();
  }

  /**
   * Resolves the OS keyboard layout; until then, and on browsers without the API, the US
   * fallback applies
   */
  private async loadLayoutMap(): Promise<void> {
    const layoutMap = await loadKeyboardLayoutMap();
    if (this.isEnabled) this.layoutMap = layoutMap;
  }

  /**
   * Enable/disable the shortcut handler
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Main keyboard event handler
   */
  handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // Auto-repeat must neither re-fire a shortcut nor touch the sequence buffer
    if (e.repeat) return;

    // Cmd+K toggles the palette from anywhere, including inputs. It runs before the
    // `defaultPrevented` check because the palette itself prevents the default to keep
    // cmdk's Ctrl+K vim binding from moving the selection.
    if ((e.metaKey || e.ctrlKey) && resolveShortcutKey(e, this.layoutMap) === "k") {
      e.preventDefault();
      this.resetSequence();
      this.togglePalette();
      return;
    }

    // A component that already handled the key (editor keymaps, cmdk navigation) wins,
    // and the key cannot be part of a sequence either
    if (e.defaultPrevented) {
      this.resetSequence();
      return;
    }

    // Keys typed into inputs and widgets never trigger shortcuts, nor continue a sequence
    if (isTypingInInput(e.target)) {
      this.resetSequence();
      return;
    }

    // Any modified key cancels a pending sequence, whether or not it matches a shortcut
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      this.resetSequence();
      this.handleModifierShortcut(e);
      return;
    }

    // Handle single key shortcuts and sequences (s, gm, op, etc.)
    this.handleKeyOrSequence(e);
  };

  /**
   * Handle modifier shortcuts (Cmd+X, Cmd+Shift+X, etc.)
   */
  private handleModifierShortcut(e: KeyboardEvent): void {
    const shortcut = formatModifierShortcut(e, this.layoutMap);
    const command = this.registry.findByModifierShortcut(this.getContext(), shortcut);

    if (command && this.canExecuteCommand(command)) {
      e.preventDefault();
      this.executeCommand(command);
    }
  }

  /**
   * Handle single key shortcuts or build sequences (s, gm, op, etc.)
   */
  private handleKeyOrSequence(e: KeyboardEvent): void {
    // Non-printable keys (Escape, Tab, Enter, arrows, ...) cancel a pending sequence
    if (e.key.length !== 1) {
      this.resetSequence();
      return;
    }

    const key = resolveShortcutKey(e, this.layoutMap);
    const ctx = this.getContext();
    // Visible commands are computed on every call outside a reactive context, so fetch the
    // map once and answer both the exact and the prefix lookup from it
    const sequenceMap = this.registry.getKeySequenceMap(ctx);

    this.sequence += key;

    // Check if sequence matches a command (e.g., "gm", "op")
    const sequenceCommandId = sequenceMap.get(this.sequence);
    const sequenceCommand = sequenceCommandId ? this.registry.getCommand(sequenceCommandId) : undefined;
    if (sequenceCommand && this.canExecuteCommand(sequenceCommand)) {
      e.preventDefault();
      this.executeCommand(sequenceCommand);
      this.resetSequence();
      return;
    }

    // The buffer can still become a sequence - wait for the next key
    if (hasSequencePrefix(sequenceMap, this.sequence)) {
      this.scheduleSequenceReset();
      return;
    }

    // A fresh key that starts no sequence is a single-key shortcut, or nothing
    if (this.sequence.length === 1) {
      const shortcutCommandId = this.registry.getShortcutMap(ctx).get(key);
      const shortcutCommand = shortcutCommandId ? this.registry.getCommand(shortcutCommandId) : undefined;
      if (shortcutCommand && this.canExecuteCommand(shortcutCommand)) {
        e.preventDefault();
        this.executeCommand(shortcutCommand);
      }
      this.resetSequence();
      return;
    }

    // A pending prefix this key does not extend: the key may start a new sequence ("g", "g",
    // "m"), otherwise the stray keystroke is dropped rather than re-read as a single-key shortcut
    this.resetSequence();
    if (hasSequencePrefix(sequenceMap, key)) {
      this.sequence = key;
      this.scheduleSequenceReset();
    }
  }

  /**
   * Schedule sequence reset
   */
  private scheduleSequenceReset(): void {
    if (this.sequenceTimeout) {
      window.clearTimeout(this.sequenceTimeout);
    }

    this.sequenceTimeout = window.setTimeout(() => {
      this.resetSequence();
    }, 1000);
  }

  /**
   * Reset key sequence
   */
  private resetSequence(): void {
    this.sequence = "";
    if (this.sequenceTimeout) {
      window.clearTimeout(this.sequenceTimeout);
      this.sequenceTimeout = null;
    }
  }

  /**
   * Check if command can be executed
   */
  private canExecuteCommand(command: TPowerKCommandConfig): boolean {
    const ctx = this.getContext();

    // Check visibility
    if (command.isVisible && !command.isVisible(ctx)) {
      return false;
    }

    // Check enablement
    if (command.isEnabled && !command.isEnabled(ctx)) {
      return false;
    }

    // Check context type requirement
    if ("contextType" in command) {
      if (!ctx.activeContext || ctx.activeContext !== command.contextType) {
        return false;
      }
    }

    return true;
  }

  /**
   * Execute a command
   */
  private executeCommand(command: TPowerKCommandConfig): void {
    const ctx = this.getContext();

    if (command.type === "action") {
      // Direct action
      command.action(ctx);
    } else if (command.type === "change-page") {
      // Opens a selection page - open palette and set active page
      this.openPalette();
      ctx.setActiveCommand(command);
      ctx.setActivePage(command.page);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.resetSequence();
    this.isEnabled = false;
  }
}
