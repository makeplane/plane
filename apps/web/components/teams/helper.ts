/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type TApiError = { error?: unknown; name?: unknown; kind?: unknown } | undefined;

const asText = (value: unknown): string => (Array.isArray(value) ? String(value[0] ?? "") : String(value ?? ""));

/**
 * Translation key for an error of the team endpoints. The API answers in English, so the cases a
 * user can run into are mapped to our own copy; the rest falls back to a generic message.
 */
export const getTeamErrorKey = (error: unknown): string => {
  const { error: message, name, kind } = (error as TApiError) ?? {};
  const text = asText(message);
  if (asText(name).includes("NAME_ALREADY_EXISTS")) return "team_structure.errors.name_taken";
  if (asText(kind).includes("MANAGEMENT_TEAM_ALREADY_EXISTS")) return "team_structure.errors.management_exists";
  if (asText(kind).includes("TEAM_HAS_PORTFOLIOS")) return "team_structure.errors.team_not_empty";
  if (text.startsWith("Assign another admin")) return "team_structure.errors.last_admin";
  if (text.startsWith("These projects would be left")) return "team_structure.errors.orphaned_project";
  if (text.startsWith("Only a team without portfolios")) return "team_structure.errors.team_not_empty";
  if (text.startsWith("Only an empty portfolio")) return "team_structure.errors.portfolio_not_empty";
  if (text.includes("archived")) return "team_structure.errors.archived";
  return "something_went_wrong_please_try_again";
};
