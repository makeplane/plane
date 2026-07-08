/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Form/store representation of custom property values, keyed by property id.
 * Every value is normalised to a list of strings so a single shape covers both
 * single and multi (``is_multi``) properties:
 *  - TEXT / URL  -> ["free text"]
 *  - DECIMAL     -> ["12.5"]
 *  - BOOLEAN     -> ["true" | "false"]
 *  - DATETIME    -> ["<ISO datetime>"]
 *  - OPTION      -> ["<option id>", ...]
 *  - RELATION    -> ["<user id | issue id>", ...]
 */
export type TIssuePropertyValues = Record<string, string[]>;

/**
 * Validation errors of custom property values, keyed by property id.
 * An empty string means "no error".
 */
export type TIssuePropertyValueErrors = Record<string, string>;
