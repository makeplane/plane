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

/** Matches field references in display format: {Field Name} — returns a new RegExp to avoid shared lastIndex state */
export const createDisplayNamePattern = (): RegExp => /\{([^}]+)\}/g;

/** Matches field references in ID format: {{property_id}} — returns a new RegExp to avoid shared lastIndex state */
export const createPropertyIdPattern = (): RegExp => /\{\{([^}]+)\}\}/g;

/** Combined pattern for syntax highlighting (field refs + strings including single quotes) — returns a new RegExp to avoid shared lastIndex state */
export const createSyntaxHighlightPattern = (): RegExp => /\{[^}]+\}|"[^"]*"|'[^']*'/g;

/** Pattern for detecting word after operator/space (autocomplete trigger) */
export const WORD_AFTER_OPERATOR_PATTERN = /(?:^|[\s+\-*/(&])([a-zA-Z][a-zA-Z\s]*)$/;

/** Pattern for detecting if cursor is inside braces */
export const INSIDE_BRACKETS_PATTERN = /\{[^}]*$/;
