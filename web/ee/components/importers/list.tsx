import { FC } from "react";
import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
// components
import { ImportersListItem } from "@/plane-web/components/importers";
// plane web types
import { TFeatureFlags } from "@/plane-web/types/feature-flag";
// logos
import AsanaLogo from "@/public/services/asana.svg";
import ClickUpLogo from "@/public/services/clickup.svg";
import JiraLogo from "@/public/services/jira.svg";
import LinearLogo from "@/public/services/linear.svg";
import NotionLogo from "@/public/services/notion.svg";

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
    title: "Jira Server",
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
];

export type ImportersListProps = {
  workspaceSlug: string;
};

export const ImportersList: FC<ImportersListProps> = observer((props) => {
  const { workspaceSlug } = props;

  return (
    <div className="flex flex-wrap gap-4 mt-6 pb-6">
      {IMPORTERS_LIST.map((item) => (
        <ImportersListItem key={item.key} workspaceSlug={workspaceSlug} provider={item} />
      ))}
    </div>
  );
});
