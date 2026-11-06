/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** The assistant's name. A brand, so it is not translated; strings take it as {name}. */
export const KHAIA_NAME = "Khaia";

/** Prompts offered on an empty chat, as keys under agents.khaia.suggestions. */
export const KHAIA_SUGGESTIONS = ["assigned_to_me", "due_this_week", "recent_activity"] as const;
