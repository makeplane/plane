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

import type { IJiraIssue, JiraIssueField } from "@plane/etl/jira-server";
import type { ExIssueComment, PlaneUser, TWorklog } from "@plane/sdk";

const JIRA_USERPICKER_CUSTOM_TYPE = "com.atlassian.jira.plugin.system.customfieldtypes:userpicker";
const JIRA_MULTIUSERPICKER_CUSTOM_TYPE = "com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker";

type JiraUserLike = {
  emailAddress?: string;
  displayName?: string;
  name?: string;
  accountId?: string;
  key?: string;
  active?: boolean;
  deleted?: boolean;
};

/**
 * Aggregated user identity during extraction. Carries the Plane-shaped fields expected
 * by `createUsers` plus a set of Jira-side account keys (`user.name` on Jira Server,
 * `user.accountId` on Jira Cloud) encountered for the same person. These account keys
 * are needed downstream to resolve changelog `item.from` / `item.to` references in
 * assignee activities, which Jira emits as account keys rather than emails.
 */
export type TExtractedUser = Partial<PlaneUser> & {
  accountKeys?: string[];
  /**
   * Derived from Jira's `active` / `deleted` flags on the user payload. `false` means the
   * Jira account is disabled or deleted — such users get imported as deactivated Plane
   * users (no seat consumed, no login). `undefined` means we couldn't observe the flag
   * (e.g. string-only sources like paginated comments); downstream the server-side seat
   * guard decides.
   */
  is_active?: boolean;
};

export type TAssociatedUsersExtractInput = {
  issues: IJiraIssue[];
  comments: Partial<ExIssueComment>[];
  worklogs: Map<string, Partial<TWorklog>[]>;
  subscribers: Map<string, string[]>;
};

/**
 * Responsibility: Aggregate all Jira user identifiers (email / display_name / first_name /
 * last_name) referenced by the issues being imported in the current batch. Input maps come
 * from the other sub-extractors, since the raw issue payload does not contain paginated
 * comment authors, paginated worklog authors, or watchers.
 *
 * Rich sources (issue assignee/creator/reporter, changelog authors, custom user fields)
 * yield both email and display_name. String-only sources (transformed comments, worklogs,
 * subscribers) carry only the identifier that upstream extractors collapsed into
 * `email || displayName`; detected as email via the presence of "@".
 */
export class JiraAssociatedUsersExtractor {
  private readonly singleUserCustomFieldIds: Set<string>;
  private readonly multiUserCustomFieldIds: Set<string>;

  constructor(rawFields: JiraIssueField[]) {
    this.singleUserCustomFieldIds = new Set<string>();
    this.multiUserCustomFieldIds = new Set<string>();

    for (const field of rawFields) {
      if (!field.id || !field.schema) continue;

      const customType = field.schema.custom;
      const systemType = field.schema.type;
      const arrayItemType = field.schema.items;

      // Single-user fields
      if (customType === JIRA_USERPICKER_CUSTOM_TYPE || systemType === "user") {
        this.singleUserCustomFieldIds.add(field.id);
        continue;
      }

      // Multi-user fields
      if (customType === JIRA_MULTIUSERPICKER_CUSTOM_TYPE || (systemType === "array" && arrayItemType === "user")) {
        this.multiUserCustomFieldIds.add(field.id);
      }
    }
  }

  public extract(input: TAssociatedUsersExtractInput): TExtractedUser[] {
    const { issues, comments, worklogs, subscribers } = input;
    const userMap = new Map<string, TExtractedUser>();

    // Rich sources first so later string-only entries can be skipped / upgraded
    for (const issue of issues) {
      this.addJiraUser(userMap, issue.fields.assignee);
      this.addJiraUser(userMap, issue.fields.creator);
      this.addJiraUser(userMap, issue.fields.reporter);

      const histories = issue.changelog?.histories ?? [];
      for (const history of histories) {
        this.addJiraUser(userMap, history.author);
      }

      for (const fieldId of this.singleUserCustomFieldIds) {
        this.addJiraUser(userMap, issue.fields[fieldId] as JiraUserLike | undefined);
      }
      for (const fieldId of this.multiUserCustomFieldIds) {
        const value = issue.fields[fieldId];
        if (Array.isArray(value)) {
          for (const entry of value as JiraUserLike[]) {
            this.addJiraUser(userMap, entry);
          }
        }
      }
    }

    // String-only sources (paginated comments / worklogs / watchers)
    for (const comment of comments) {
      this.addIdentifier(userMap, comment.created_by);
      this.addIdentifier(userMap, comment.actor);
    }
    for (const issueWorklogs of worklogs.values()) {
      for (const worklog of issueWorklogs) {
        this.addIdentifier(userMap, worklog.logged_by);
      }
    }
    for (const issueSubscribers of subscribers.values()) {
      for (const subscriber of issueSubscribers) {
        this.addIdentifier(userMap, subscriber);
      }
    }

    return Array.from(userMap.values());
  }

  private addJiraUser(sink: Map<string, TExtractedUser>, user: JiraUserLike | null | undefined): void {
    if (!user) return;
    const email = user.emailAddress || undefined;
    const displayName = user.displayName || undefined;
    const key = email || displayName;
    if (!key) return;

    // Jira Server uses `name` as the user key, Jira Cloud uses `accountId`. Both appear
    // as `item.from` / `item.to` in assignee changelog entries, so capture either form.
    const accountKeys: string[] = [];
    if (user.name) accountKeys.push(user.name);
    if (user.accountId) accountKeys.push(user.accountId);
    if (user.key) accountKeys.push(user.key);

    const existing = sink.get(key);
    const [firstName, ...rest] = (displayName ?? existing?.display_name ?? "").trim().split(/\s+/);
    const mergedAccountKeys = Array.from(new Set([...(existing?.accountKeys ?? []), ...accountKeys]));

    // Deactivation is sticky — if any source (existing or incoming) says the Jira account
    // is disabled or deleted, the extracted user stays inactive. Only when every observation
    // has been `active && !deleted` do we flag `is_active: true`. Undefined means unknown.
    const incomingInactive = user.active === false || user.deleted === true;
    const incomingActive = user.active === true && user.deleted !== true;
    let mergedIsActive: boolean | undefined = existing?.is_active;
    if (incomingInactive) {
      mergedIsActive = false;
    } else if (mergedIsActive === undefined && incomingActive) {
      mergedIsActive = true;
    }

    sink.set(key, {
      ...(email ? { email } : existing?.email ? { email: existing.email } : {}),
      ...(displayName
        ? { display_name: displayName }
        : existing?.display_name
          ? { display_name: existing.display_name }
          : {}),
      first_name: firstName ?? existing?.first_name ?? "",
      last_name: rest.length > 0 ? rest.join(" ") : (existing?.last_name ?? ""),
      ...(mergedAccountKeys.length > 0 ? { accountKeys: mergedAccountKeys } : {}),
      ...(mergedIsActive !== undefined ? { is_active: mergedIsActive } : {}),
    });
  }

  private addIdentifier(sink: Map<string, TExtractedUser>, identifier: string | null | undefined): void {
    if (!identifier) return;
    // Skip if a rich entry already exists under this key (avoid overwriting with partial data)
    if (sink.has(identifier)) return;

    const looksLikeEmail = identifier.includes("@");
    if (looksLikeEmail) {
      const localPart = identifier.split("@")[0] ?? "";
      sink.set(identifier, {
        email: identifier,
        display_name: localPart,
        first_name: localPart,
        last_name: "",
      });
    } else {
      sink.set(identifier, {
        display_name: identifier,
        first_name: identifier,
        last_name: "",
      });
    }
  }
}
