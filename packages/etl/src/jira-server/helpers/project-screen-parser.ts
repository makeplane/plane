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

import { parse, HTMLElement } from "node-html-parser";
import type {
  TJiraConsolidatedIssueTypeScreenScheme,
  TJiraScreenIssueType,
  TJiraIssueTypeScreenScheme,
  TJiraScreenRawData,
  TJiraRawScreenScheme,
  TJiraScreen,
  TJiraScreenOperations,
  TJiraScreenSchemeQueryOptions,
} from "../types/project-screens";

// ── Constants ────────────────────────────────────────────────────────────────

const JIRA_SELECTORS = {
  EDIT_LINK: "#project-config-screens-scheme-edit",
  ITSS_NAME: "#project-config-scheme-name",
  SIDEBAR_ISSUE_TYPES: "#project_issuetypes",
  SCREEN_SCHEME: ".project-config-screenScheme",
  SCHEME_NAME: ".project-config-screenscheme-name",
  DEFAULT_LOZENGE: ".project-config-scheme-item-header .aui-lozenge.status-default",
  ISSUE_TYPE_LIST: ".project-config-screens-issuetypes .project-config-list li",
  ISSUE_TYPE_NAME: ".project-config-issuetype-name",
  DEFAULT_LIST_ITEM: ".project-config-list-default",
  SCREEN_ROW: ".project-config-screens-screen",
  SCREEN_OPERATION: ".project-config-screens-screen-operation",
  SCREEN_FIELD_ID: ".project-config-screens-field-screen-id",
  SCREEN_LINK: ".project-config-screen",
} as const;

const JIRA_ATTRIBUTES = {
  DATA_ID: "data-id",
  DATA_ISSUE_TYPES: "data-issue-types",
  ID: "id",
  HREF: "href",
  VALUE: "value",
} as const;

const JIRA_DOM = {
  SCHEME_ID_PREFIX: "project-config-screens-",
} as const;

const JIRA_ENTITIES = [
  { regex: /&amp;/g, replacement: "&" },
  { regex: /&lt;/g, replacement: "<" },
  { regex: /&gt;/g, replacement: ">" },
  { regex: /&quot;/g, replacement: '"' },
  { regex: /&#039;/g, replacement: "'" },
] as const;

const JIRA_DEFAULTS = {
  ID: "0",
  EMPTY_STRING: "",
  QUERY_ALL: "all",
} as const;

const OPERATION_LABEL_MAP: Record<string, keyof TJiraScreenOperations> = {
  "create issue": "createIssue",
  "edit issue": "editIssue",
  "view issue": "viewIssue",
};

/**
 * node-html-parser returns raw text with HTML entities intact.
 * This strips tags and decodes the most common entities.
 */
function innerText(el: HTMLElement | null): string {
  if (!el) return JIRA_DEFAULTS.EMPTY_STRING;

  let text = el.textContent;
  for (const entity of JIRA_ENTITIES) {
    text = text.replace(entity.regex, entity.replacement);
  }

  return text.trim();
}

export function parseJiraScreensHtml(html: string): TJiraScreenRawData {
  const root = parse(html);

  // ── Issue Type Screen Scheme ─────────────────────────────────────────────

  // ITSS id lives on the "Edit screens" action link as data-id
  const editLink = root.querySelector(JIRA_SELECTORS.EDIT_LINK);
  const itssId = parseInt(editLink?.getAttribute(JIRA_ATTRIBUTES.DATA_ID) ?? JIRA_DEFAULTS.ID, 10);

  // ITSS name lives in the info message banner
  const itssNameEl = root.querySelector(JIRA_SELECTORS.ITSS_NAME);
  const itssName = innerText(itssNameEl);

  const issueTypeScreenScheme: TJiraIssueTypeScreenScheme = {
    id: itssId,
    name: itssName,
  };

  // ── Issue type id lookup from sidebar JSON blob ──────────────────────────

  // The sidebar nav carries data-issue-types JSON: [{ id, name }, ...]
  // We use this to enrich issue type rows which don't carry ids in the HTML.
  const sidebarMap = new Map<string, string>();
  const sidebarEl = root.querySelector(JIRA_SELECTORS.SIDEBAR_ISSUE_TYPES);
  const sidebarJson = sidebarEl?.getAttribute(JIRA_ATTRIBUTES.DATA_ISSUE_TYPES);
  if (sidebarJson) {
    try {
      const sidebarTypes: Array<{ id: string; name: string }> = JSON.parse(sidebarJson);
      sidebarTypes.forEach((t) => sidebarMap.set(t.name, t.id));
    } catch {
      // malformed JSON — ids fall back to empty string
    }
  }

  // ── Screen Schemes ───────────────────────────────────────────────────────

  const schemeEls = root.querySelectorAll(JIRA_SELECTORS.SCREEN_SCHEME);

  const screenSchemes: TJiraRawScreenScheme[] = schemeEls.map((schemeEl): TJiraRawScreenScheme => {
    // ID — encoded in the element's id: "project-config-screens-10050"
    const rawId = (schemeEl.getAttribute(JIRA_ATTRIBUTES.ID) ?? JIRA_DEFAULTS.EMPTY_STRING).replace(
      JIRA_DOM.SCHEME_ID_PREFIX,
      JIRA_DEFAULTS.EMPTY_STRING
    );
    const schemeId = parseInt(rawId, 10);

    // Name
    const nameEl = schemeEl.querySelector(JIRA_SELECTORS.SCHEME_NAME);
    const schemeName = innerText(nameEl);

    // Default — presence of the "Default" status lozenge in the header
    const isDefault = schemeEl.querySelector(JIRA_SELECTORS.DEFAULT_LOZENGE) !== null;

    // ── Issue types ──────────────────────────────────────────────────────

    const issueTypeEls = schemeEl.querySelectorAll(JIRA_SELECTORS.ISSUE_TYPE_LIST);

    const issueTypes: TJiraScreenIssueType[] = issueTypeEls.map((li) => {
      const nameSpan = li.querySelector(JIRA_SELECTORS.ISSUE_TYPE_NAME);
      const name = innerText(nameSpan);
      const id = sidebarMap.get(name) ?? JIRA_DEFAULTS.EMPTY_STRING;
      const hasDefaultLozenge = li.querySelector(JIRA_SELECTORS.DEFAULT_LIST_ITEM) !== null;

      return {
        id,
        name,
        ...(hasDefaultLozenge ? { isDefault: true } : {}),
      };
    });

    // ── Screens / operations ─────────────────────────────────────────────

    const screenRows = schemeEl.querySelectorAll(JIRA_SELECTORS.SCREEN_ROW);

    const operationsPartial: Partial<TJiraScreenOperations> = {};

    screenRows.forEach((row) => {
      const operationText = innerText(row.querySelector(JIRA_SELECTORS.SCREEN_OPERATION)).toLowerCase();

      const opKey = OPERATION_LABEL_MAP[operationText];
      if (!opKey) return;

      const screenIdEl = row.querySelector(JIRA_SELECTORS.SCREEN_FIELD_ID);
      const screenId = parseInt(screenIdEl?.getAttribute(JIRA_ATTRIBUTES.VALUE) ?? JIRA_DEFAULTS.ID, 10);

      const screenLinkEl = row.querySelector(JIRA_SELECTORS.SCREEN_LINK);
      const screenUrl = screenLinkEl?.getAttribute(JIRA_ATTRIBUTES.HREF) ?? JIRA_DEFAULTS.EMPTY_STRING;

      // Strip the icon span text — grab only direct text nodes by removing
      // the inner <span> content from the full textContent
      const fullText = innerText(screenLinkEl);
      const iconText = innerText(screenLinkEl?.querySelector("span") ?? null);
      const screenName = fullText.replace(iconText, JIRA_DEFAULTS.EMPTY_STRING).trim();

      operationsPartial[opKey] = { id: screenId, name: screenName, url: screenUrl };
    });

    // Guarantee all three keys are present
    const emptyScreen: TJiraScreen = { id: 0, name: JIRA_DEFAULTS.EMPTY_STRING, url: JIRA_DEFAULTS.EMPTY_STRING };
    const screens: TJiraScreenOperations = {
      createIssue: operationsPartial.createIssue ?? emptyScreen,
      editIssue: operationsPartial.editIssue ?? emptyScreen,
      viewIssue: operationsPartial.viewIssue ?? emptyScreen,
    };

    return { id: schemeId, name: schemeName, isDefault, issueTypes, screens };
  });

  return { issueTypeScreenScheme, screenSchemes };
}

/**
 * Returns array[n] — one TConsolidatedIssueTypeScreenScheme per screen scheme.
 * All schemes are always present in the returned array.
 * Filters narrow data within each entry only — they never drop array items.
 */
export function queryScreenSchemes(
  data: TJiraScreenRawData,
  options: TJiraScreenSchemeQueryOptions = {}
): TJiraConsolidatedIssueTypeScreenScheme[] {
  const { operation = JIRA_DEFAULTS.QUERY_ALL, issueType = JIRA_DEFAULTS.QUERY_ALL } = options;

  return data.screenSchemes.map((scheme): TJiraConsolidatedIssueTypeScreenScheme => {
    const filteredIssueTypes: TJiraScreenIssueType[] =
      issueType === JIRA_DEFAULTS.QUERY_ALL
        ? scheme.issueTypes
        : scheme.issueTypes.filter((it) => it.name === issueType);

    const filteredOperations: TJiraScreenOperations =
      operation === JIRA_DEFAULTS.QUERY_ALL
        ? scheme.screens
        : (Object.fromEntries(
            Object.entries(scheme.screens).filter(([key]) => key === operation)
          ) as TJiraScreenOperations);

    const uniqueScreens: TJiraScreen[] = [
      ...new Map(Object.values(scheme.screens).map((screen) => [screen.id, screen])).values(),
    ];

    return {
      issueTypeScreenScheme: data.issueTypeScreenScheme,
      screenScheme: {
        id: scheme.id,
        name: scheme.name,
        isDefault: scheme.isDefault,
      },
      issueTypes: filteredIssueTypes,
      screens: uniqueScreens,
      operations: filteredOperations,
    };
  });
}
