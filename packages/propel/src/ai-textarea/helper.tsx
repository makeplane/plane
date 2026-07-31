/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export interface AISlashCommand {
  name: string;
  label: string;
  description?: string;
  icon?: React.ReactElement;
}

export interface AITextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  mode?: "primary" | "transparent";
  hasError?: boolean;
  /** Slash commands shown when the user types / */
  commands?: AISlashCommand[];
  /** Called when user selects a slash command */
  onCommand?: (command: AISlashCommand) => void;
  onChange?: (value: string) => void;
}
