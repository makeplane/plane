/**
 * Translation Store
 *
 * React bindings for i18next using useSyncExternalStore.
 * This replaces react-i18next to avoid CJS/ESM compatibility issues.
 */

import { useSyncExternalStore } from "react";
import i18next from "i18next";
import type { LanguageCode } from "../config/languages";

// ============================================================================
// Types
// ============================================================================

type Listener = () => void;

// ============================================================================
// Store Implementation
// ============================================================================

const listeners = new Set<Listener>();

// Track the current state version for React to detect changes
let stateVersion = 0;

function notify(): void {
  stateVersion++;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): number {
  return stateVersion;
}

function getServerSnapshot(): number {
  return stateVersion;
}

// ============================================================================
// i18next Event Listeners
// ============================================================================

// Listen to i18next events and notify React
i18next.on("languageChanged", () => notify());
i18next.on("loaded", () => notify());
i18next.on("added", () => notify());

// ============================================================================
// React Hook
// ============================================================================

/**
 * Subscribe to i18next changes
 * Returns the state version which changes whenever i18next updates
 */
export function useI18nStore(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Get the i18next instance
 */
export function getI18n(): typeof i18next {
  return i18next;
}

/**
 * Get current language
 */
export function getLanguage(): LanguageCode {
  return (i18next.language || "en") as LanguageCode;
}

/**
 * Check if i18next is initialized
 */
export function isInitialized(): boolean {
  return i18next.isInitialized;
}

export { i18next };
