import { FC } from "react";
import { observer } from "mobx-react";
import { StaticImageData } from "next/image";
// plane web components
import { IntegrationListItem } from "@/plane-web/components/integrations";
// plane web types
import { E_FEATURE_FLAGS, TFeatureFlags } from "@/plane-web/types/feature-flag";
// logos
import GitHubLogo from "@/public/services/github.svg";
import GitlabLogo from "@/public/services/gitlab.svg";
import SlackLogo from "@/public/services/slack.png";

export type IntegrationProps = {
  flag: TFeatureFlags;
  key: string;
  title: string;
  description: string;
  logo: StaticImageData;
  beta: boolean;
};

const INTEGRATIONS_LIST: IntegrationProps[] = [
  {
    flag: E_FEATURE_FLAGS.GITHUB_INTEGRATION,
    key: "github",
    title: "GitHub",
    description: "Connect your GitHub repository to Plane.",
    logo: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_INTEGRATION,
    key: "gitlab",
    title: "GitLab",
    description: "Connect your GitLab repository to Plane.",
    logo: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SLACK_INTEGRATION,
    key: "slack",
    title: "Slack",
    description: "Connect your Slack workspace to Plane.",
    logo: SlackLogo,
    beta: true,
  },
];

export type IntegrationsListProps = {
  workspaceSlug: string;
};

export const IntegrationsList: FC<IntegrationsListProps> = observer((props) => {
  const { workspaceSlug } = props;
  return (
    <div>
      {INTEGRATIONS_LIST.map((item) => (
        <>
          <IntegrationListItem workspaceSlug={workspaceSlug} provider={item} />
        </>
      ))}
    </div>
  );
});
