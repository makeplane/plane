/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface AICommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Whether the AI query mode is active */
  aiMode?: boolean;
  /** Toggle between normal search and AI mode */
  onAIModeChange?: (enabled: boolean) => void;
  /** Called when the user submits an AI query (Enter in AI mode) */
  onAIQuery?: (query: string) => void;
  /** Show spinner while the AI is processing */
  isAILoading?: boolean;
  placeholder?: string;
  aiPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
}
