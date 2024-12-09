import { FC } from "react";
import { observer } from "mobx-react";
// components
import { ImportersListItem } from "@/plane-web/components/importers";
// plane web types
import { E_FEATURE_FLAGS, TFeatureFlags } from "@/plane-web/types/feature-flag";
// logos
import AsanaLogo from "@/public/services/asana.svg";
import JiraLogo from "@/public/services/jira.svg";
import LinearLogo from "@/public/services/linear.svg";

export type ImporterProps = {
  flag: TFeatureFlags;
  key: string;
  title: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logo: any;
  beta: boolean;
};

export const IMPORTERS_LIST: ImporterProps[] = [
  {
    flag: E_FEATURE_FLAGS.JIRA_IMPORTER,
    key: "jira",
    title: "Jira",
    description: "Import your Jira data into Plane projects.",
    logo: JiraLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.JIRA_SERVER_IMPORTER,
    key: "jira-server",
    title: "Jira Server",
    description: "Import your Jira server data into Plane projects.",
    logo: JiraLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.LINEAR_IMPORTER,
    key: "linear",
    title: "Linear",
    description: "Import your Linear data into Plane projects.",
    logo: LinearLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.ASANA_IMPORTER,
    key: "asana",
    title: "Asana",
    description: "Import your Asana data into Plane projects.",
    logo: AsanaLogo,
    beta: true,
  },
];

export type ImportersListProps = {
  workspaceSlug: string;
};

export const ImportersList: FC<ImportersListProps> = observer((props) => {
  const { workspaceSlug } = props;

  return (
    <div>
      {IMPORTERS_LIST.map((item) => (
        <>
          <ImportersListItem workspaceSlug={workspaceSlug} provider={item} />
        </>
      ))}
    </div>
  );
});
