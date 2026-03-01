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

import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
// assets
import AsanaLogo from "@/app/assets/services/asana.svg?url";
import ClickUpLogo from "@/app/assets/services/clickup.svg?url";
import ConfluenceLogo from "@/app/assets/services/confluence.svg?url";
import CSVLogo from "@/app/assets/services/csv.svg?url";
import JiraLogo from "@/app/assets/services/jira.svg?url";
import LinearLogo from "@/app/assets/services/linear.svg?url";
import NotionLogo from "@/app/assets/services/notion.svg?url";
// plane web imports
import { ImportersListItem } from "@/components/importers/list-item";
import type { TFeatureFlags } from "@/types/feature-flag";

export type ImporterProps = {
  flag: TFeatureFlags;
  key: string;
  title: string;
  i18n_description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logo: any;
  beta: boolean;
};

export const IMPORTERS_LIST: ImporterProps[] = [
  {
    flag: E_FEATURE_FLAGS.JIRA_IMPORTER,
    key: "jira",
    title: "Jira",
    i18n_description: "jira_importer.jira_importer_description",
    logo: JiraLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.JIRA_SERVER_IMPORTER,
    key: "jira-server",
    title: "Jira Server/Data Center",
    i18n_description: "jira_server_importer.jira_server_importer_description",
    logo: JiraLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.LINEAR_IMPORTER,
    key: "linear",
    title: "Linear",
    i18n_description: "linear_importer.linear_importer_description",
    logo: LinearLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.ASANA_IMPORTER,
    key: "asana",
    title: "Asana",
    i18n_description: "asana_importer.asana_importer_description",
    logo: AsanaLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.CLICKUP_IMPORTER,
    key: "clickup",
    title: "ClickUp",
    i18n_description: "clickup_importer.clickup_importer_description",
    logo: ClickUpLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.NOTION_IMPORTER,
    key: "notion",
    title: "Notion",
    i18n_description: "notion_importer.notion_importer_description",
    logo: NotionLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.CONFLUENCE_IMPORTER,
    key: "confluence",
    title: "Confluence",
    i18n_description: "confluence_importer.confluence_importer_description",
    logo: ConfluenceLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.CSV_IMPORTER,
    key: "csv-import",
    title: "CSV",
    i18n_description: "csv_importer.csv_importer_description",
    logo: CSVLogo,
    beta: true,
  },
];

export type ImportersListProps = {
  workspaceSlug: string;
};

export const ImportersList = observer(function ImportersList(props: ImportersListProps) {
  const { workspaceSlug } = props;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {IMPORTERS_LIST.map((item) => (
        <ImportersListItem key={item.key} workspaceSlug={workspaceSlug} provider={item} />
      ))}
    </div>
  );
});
