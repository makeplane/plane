/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TImportProviderAvailability = "available" | "partial" | "unavailable";

export type TImportHubProviderId = "jira" | "jira_server" | "linear" | "asana" | "clickup";

export type TImportHubLaunch = "route" | "unavailable";

export type TImportHubProvider = {
  id: TImportHubProviderId;
  /** Backend `Importer.service` value when a job exists; hub ids may differ. */
  service: string;
  i18nLabel: string;
  i18nDescription: string;
  beta: boolean;
  availability: TImportProviderAvailability;
  launch: TImportHubLaunch;
  /** Path segment under `/:workspaceSlug/settings/imports/` when launch is `route`. */
  path?: string;
};

export const IMPORT_HUB_PROVIDERS: TImportHubProvider[] = [
  {
    id: "jira",
    service: "jira",
    i18nLabel: "workspace_settings.settings.imports.providers.jira.label",
    i18nDescription: "workspace_settings.settings.imports.providers.jira.description",
    beta: false,
    availability: "available",
    launch: "route",
    path: "jira",
  },
  {
    id: "jira_server",
    service: "jira_server",
    i18nLabel: "workspace_settings.settings.imports.providers.jira_server.label",
    i18nDescription: "workspace_settings.settings.imports.providers.jira_server.description",
    beta: true,
    availability: "unavailable",
    launch: "unavailable",
  },
  {
    id: "linear",
    service: "linear",
    i18nLabel: "workspace_settings.settings.imports.providers.linear.label",
    i18nDescription: "workspace_settings.settings.imports.providers.linear.description",
    beta: true,
    availability: "unavailable",
    launch: "unavailable",
  },
  {
    id: "asana",
    service: "asana",
    i18nLabel: "workspace_settings.settings.imports.providers.asana.label",
    i18nDescription: "workspace_settings.settings.imports.providers.asana.description",
    beta: true,
    availability: "unavailable",
    launch: "unavailable",
  },
  {
    id: "clickup",
    service: "clickup",
    i18nLabel: "workspace_settings.settings.imports.providers.clickup.label",
    i18nDescription: "workspace_settings.settings.imports.providers.clickup.description",
    beta: true,
    availability: "unavailable",
    launch: "unavailable",
  },
];

export const IMPORT_HUB_PROVIDER_BY_SERVICE: Record<string, TImportHubProvider> = Object.fromEntries(
  IMPORT_HUB_PROVIDERS.map((provider) => [provider.service, provider])
);

export const IMPORTABLE_IMPORTER_STATUSES: ReadonlySet<string> = new Set(["queued", "processing"]);
