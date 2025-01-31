import { FC } from "react";
import { observer } from "mobx-react";
import { StaticImageData } from "next/image";
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web components
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { IntegrationListItem } from "@/plane-web/components/integrations";
// plane web types
import { TFeatureFlags } from "@/plane-web/types/feature-flag";
// logos
import GitHubLogo from "@/public/services/github.svg";
import GitlabLogo from "@/public/services/gitlab.svg";
import SlackLogo from "@/public/services/slack.png";

export type IntegrationProps = {
  flag: TFeatureFlags;
  title: string;
  key: string;
  logo: StaticImageData;
  beta: boolean;
};

const INTEGRATIONS_LIST: IntegrationProps[] = [
  {
    flag: E_FEATURE_FLAGS.GITHUB_INTEGRATION,
    key: "github",
    title: "GitHub",
    logo: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_INTEGRATION,
    key: "gitlab",
    title: "GitLab",
    logo: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SLACK_INTEGRATION,
    key: "slack",
    title: "Slack",
    logo: SlackLogo,
    beta: true,
  },
];

export type IntegrationsListProps = {
  workspaceSlug: string;
  supportedIntegrations: E_INTEGRATION_KEYS[];
};

export const IntegrationsList: FC<IntegrationsListProps> = observer((props) => {
  const { workspaceSlug, supportedIntegrations } = props;

  return (
    <div>
      {INTEGRATIONS_LIST.map((item) => (
        <>
          <IntegrationListItem
            workspaceSlug={workspaceSlug}
            provider={item}
            isSupported={supportedIntegrations.includes(item.key.toUpperCase() as E_INTEGRATION_KEYS)}
          />
        </>
      ))}
    </div>
  );
});
