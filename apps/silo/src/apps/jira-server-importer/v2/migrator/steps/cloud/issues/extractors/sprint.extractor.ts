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

import type { JiraSprintObject } from "@plane/etl/jira";
import type { IJiraIssue } from "@plane/etl/jira-server";
import { JiraSprintExtractor } from "../../../shared/issues/extractors/sprint.extractor";
import { buildExternalId } from "@/apps/jira-server-importer/v2/helpers/job";

/**
 * Lifecycle states a Jira sprint can be in.
 * Values are lowercase to match the Jira Cloud REST API payload
 * (`"active" | "future" | "closed"`). Compare against
 * `state.toLowerCase()` so Jira Server's uppercase variants are
 * also handled.
 */
enum EJiraSprintState {
  ACTIVE = "active",
  FUTURE = "future",
  CLOSED = "closed",
}

/**
 * Extracts the sprint association for a Jira Cloud issue.
 *
 * Overrides the shared (Jira Server) extractor because Jira Cloud
 * returns sprint data as an array of structured objects inside a
 * `customfield_*` field, whereas Jira Server emits a GreenHopper
 * `toString()` blob that needs regex parsing.
 */
export class JiraCloudSprintExtractor extends JiraSprintExtractor {
  constructor(projectId: string, resourceId: string) {
    super(projectId, resourceId);
  }

  /**
   * Extracts a single sprint external id for the given issue.
   *
   * Why a single sprint? Plane cycles are 1:1 with a work item, but
   * Jira keeps the full sprint history of an issue on the custom
   * field — a story that has moved across four sprints will carry
   * all four. We collapse that history to the "current" sprint in
   * the user's mental model using the following priority:
   *
   *   1. ACTIVE  → the sprint the issue is in right now.
   *                If somehow more than one is active (rare, cross-
   *                board scenarios), pick the one that started most
   *                recently.
   *   2. FUTURE  → no active sprint, so use the next upcoming one
   *                (earliest `startDate`).
   *   3. CLOSED  → issue sits only in past sprints; use the most
   *                recently finished one (latest `endDate`).
   *
   * If the issue has no recognisable sprint field, returns `[]`.
   * Otherwise always returns a single-element array so callers that
   * spread the result keep working.
   *
   * @param issue - Jira issue whose sprint association we want.
   * @returns An array with one external sprint id, or an empty array.
   */
  public extract(issue: IJiraIssue): string[] {
    const sprints = this.findSprintField(issue);
    if (!sprints) return [];

    const chosen = this.pickSprint(sprints);
    return [buildExternalId(this.projectId, this.resourceId, chosen.id.toString())];
  }

  /**
   * Scans the issue's `customfield_*` fields for the one holding
   * sprint data. Jira's sprint field id varies per instance
   * (e.g. `customfield_10020`), so we detect it structurally instead
   * of hard-coding the key.
   *
   * @param issue - Jira issue to inspect.
   * @returns The sprint array if found, otherwise `null`.
   */
  private findSprintField(issue: IJiraIssue): JiraSprintObject[] | null {
    for (const [fieldKey, fieldValue] of Object.entries(issue.fields)) {
      if (!fieldKey.startsWith("customfield_")) continue;
      if (this.isSprintField(fieldValue)) return fieldValue;
    }
    return null;
  }

  /**
   * Type guard identifying a Jira Cloud sprint array by checking
   * that the first element has the shape of a sprint object
   * (`id`, `name`, `state`, `boardId`). Cloud always returns the
   * sprint custom field as an array — single-sprint payloads are
   * arrays of length 1.
   *
   * @param value - Unknown custom field value.
   * @returns `true` if `value` is an array of sprint objects.
   */
  private isSprintField(value: unknown): value is JiraSprintObject[] {
    if (!Array.isArray(value) || value.length === 0) return false;
    const first = value[0] as Record<string, unknown> | null;
    return (
      !!first &&
      first.id != null &&
      typeof first.name === "string" &&
      typeof first.state === "string" &&
      first.boardId != null
    );
  }

  /**
   * Applies the active > future > closed priority to choose the
   * single sprint that best represents the issue's current cycle.
   * Short-circuits when there is only one sprint.
   *
   * @param sprints - Non-empty list of sprints from the issue.
   * @returns The chosen sprint.
   */
  private pickSprint(sprints: JiraSprintObject[]): JiraSprintObject {
    if (sprints.length === 1) return sprints[0];

    const active = this.filterByState(sprints, EJiraSprintState.ACTIVE);
    if (active.length > 0) return this.latestByStart(active);

    const future = this.filterByState(sprints, EJiraSprintState.FUTURE);
    if (future.length > 0) return this.earliestByStart(future);

    const closed = this.filterByState(sprints, EJiraSprintState.CLOSED);
    // Fallback to the full list when no `CLOSED` sprint is present
    // so an unknown/custom state still yields a deterministic pick.
    return this.latestByEnd(closed.length > 0 ? closed : sprints);
  }

  /**
   * Filters sprints by state, case-insensitively. Needed because
   * Jira Cloud uses lowercase (`"active"`) and Jira Server uses
   * uppercase (`"ACTIVE"`).
   *
   * @param sprints - Sprints to filter.
   * @param state - Target state to match.
   * @returns Sprints whose state equals `state`.
   */
  private filterByState(sprints: JiraSprintObject[], state: EJiraSprintState): JiraSprintObject[] {
    return sprints.filter((s) => s.state?.toLowerCase() === state);
  }

  /**
   * Parses a Jira ISO-8601 date string into a millisecond
   * timestamp. Returns `NaN` for missing or invalid values so
   * callers can skip them without throwing.
   *
   * @param value - ISO date string from Jira, or `undefined`.
   * @returns Epoch milliseconds, or `NaN`.
   */
  private parseTime(value: string | undefined): number {
    if (!value) return NaN;
    const t = Date.parse(value);
    return Number.isNaN(t) ? NaN : t;
  }

  /**
   * Returns the sprint with the most recent `startDate`. Used to
   * disambiguate multiple ACTIVE sprints — the one that started
   * most recently is the one the issue most likely belongs to.
   *
   * @param sprints - Non-empty sprint list.
   * @returns Sprint with the greatest `startDate`.
   */
  private latestByStart(sprints: JiraSprintObject[]): JiraSprintObject {
    return sprints.reduce((latest, s) =>
      (this.parseTime(s.startDate) || 0) > (this.parseTime(latest.startDate) || 0) ? s : latest
    );
  }

  /**
   * Returns the sprint with the earliest `startDate`. Used for
   * FUTURE sprints so we pick the next upcoming one.
   * Sprints with missing/invalid `startDate` are deprioritised.
   *
   * @param sprints - Non-empty sprint list.
   * @returns Sprint with the smallest valid `startDate`.
   */
  private earliestByStart(sprints: JiraSprintObject[]): JiraSprintObject {
    return sprints.reduce((earliest, s) => {
      const a = this.parseTime(s.startDate);
      const b = this.parseTime(earliest.startDate);
      if (Number.isNaN(a)) return earliest;
      if (Number.isNaN(b)) return s;
      return a < b ? s : earliest;
    });
  }

  /**
   * Returns the sprint with the most recent `endDate`. Used for
   * CLOSED sprints so we pick the most recently finished one.
   *
   * @param sprints - Non-empty sprint list.
   * @returns Sprint with the greatest `endDate`.
   */
  private latestByEnd(sprints: JiraSprintObject[]): JiraSprintObject {
    return sprints.reduce((latest, s) =>
      (this.parseTime(s.endDate) || 0) > (this.parseTime(latest.endDate) || 0) ? s : latest
    );
  }
}
