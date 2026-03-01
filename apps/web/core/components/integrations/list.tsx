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

import type { FC } from "react";
import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web components
import type { E_INTEGRATION_KEYS } from "@plane/types";
// assets
import GitHubLogo from "@/app/assets/services/github.svg?url";
import GitlabLogo from "@/app/assets/services/gitlab.svg?url";
import SentryLogo from "@/app/assets/services/sentry.svg?url";
import SlackLogo from "@/app/assets/services/slack.png?url";
// plane web imports
import { IntegrationListItem } from "@/components/integrations";
import type { TFeatureFlags } from "@/types/feature-flag";

export type IntegrationProps = {
  flag: TFeatureFlags;
  urlSlug: string;
  title: string;
  key: string;
  logo: string;
  beta: boolean;
};

const INTEGRATIONS_LIST: IntegrationProps[] = [
  {
    flag: E_FEATURE_FLAGS.GITHUB_INTEGRATION,
    urlSlug: "github",
    key: "github",
    title: "GitHub",
    logo: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITHUB_ENTERPRISE_INTEGRATION,
    urlSlug: "github-enterprise",
    key: "github_enterprise",
    title: "GitHub Enterprise",
    logo: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_INTEGRATION,
    urlSlug: "gitlab",
    key: "gitlab",
    title: "GitLab",
    logo: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_ENTERPRISE_INTEGRATION,
    urlSlug: "gitlab-enterprise",
    key: "gitlab_enterprise",
    title: "GitLab Enterprise",
    logo: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SLACK_INTEGRATION,
    urlSlug: "slack",
    key: "slack",
    title: "Slack",
    logo: SlackLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SENTRY_INTEGRATION,
    urlSlug: "sentry",
    key: "sentry",
    title: "Sentry",
    logo: SentryLogo,
    beta: true,
  },
];

export type IntegrationsListProps = {
  workspaceSlug: string;
  supportedIntegrations: E_INTEGRATION_KEYS[];
};

export const IntegrationsList = observer(function IntegrationsList(props: IntegrationsListProps) {
  const { workspaceSlug, supportedIntegrations } = props;

  return (
    <div className="flex flex-wrap gap-4 mt-6">
      {INTEGRATIONS_LIST.map((item) => (
        <IntegrationListItem
          key={item.key}
          workspaceSlug={workspaceSlug}
          provider={item}
          isSupported={supportedIntegrations.includes(item.key.toUpperCase() as E_INTEGRATION_KEYS)}
        />
      ))}
    </div>
  );
});
