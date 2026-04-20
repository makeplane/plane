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
import type { E_INTEGRATION_KEYS, TUserApplication } from "@plane/types";
//assets
import BitbucketLogo from "@/app/assets/services/bitbucket.svg?url";
import GitHubLogo from "@/app/assets/logos/integrations/github.png?url";
import GitlabLogo from "@/app/assets/logos/integrations/gitlab.png?url";
import SentryLogo from "@/app/assets/logos/integrations/sentry.png?url";
import SlackLogo from "@/app/assets/logos/integrations/slack.png?url";
import OAuthBridgeLogo from "@/app/assets/logos/integrations/oauth-bridge.svg?url";
// plane web imports
import { AppList } from "@/components/marketplace";
import type { TFeatureFlags } from "@/types/feature-flag";
import { Link } from "react-router";
import { getButtonStyling } from "@plane/propel/button";
import { useIntegrationPermissions } from "@/hooks/store/integrations/use-integration-permissions";

// list all the applications
// have tabs to filter by category
// have search bar to search by name

type AppListProps = {
  apps: TUserApplication[];
  supportedIntegrations: E_INTEGRATION_KEYS[];
  workspaceSlug: string;
};

export type IntegrationProps = {
  flag: TFeatureFlags;
  urlSlug: string;
  title: string;
  key: string;
  logoUrl: string;
  beta: boolean;
};

const INTEGRATIONS_LIST: IntegrationProps[] = [
  {
    flag: E_FEATURE_FLAGS.GITHUB_INTEGRATION,
    urlSlug: "github",
    key: "github",
    title: "GitHub",
    logoUrl: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_INTEGRATION,
    urlSlug: "gitlab",
    key: "gitlab",
    title: "GitLab",
    logoUrl: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SLACK_INTEGRATION,
    urlSlug: "slack",
    key: "slack",
    title: "Slack",
    logoUrl: SlackLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SENTRY_INTEGRATION,
    urlSlug: "sentry",
    key: "sentry",
    title: "Sentry",
    logoUrl: SentryLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITHUB_ENTERPRISE_INTEGRATION,
    urlSlug: "github-enterprise",
    key: "github_enterprise",
    title: "GitHub Enterprise",
    logoUrl: GitHubLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_ENTERPRISE_INTEGRATION,
    urlSlug: "gitlab-enterprise",
    key: "gitlab_enterprise",
    title: "GitLab Enterprise",
    logoUrl: GitlabLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.BITBUCKET_DC_INTEGRATION,
    urlSlug: "bitbucket-dc",
    key: "bitbucket_dc",
    title: "Bitbucket Data Center",
    logoUrl: BitbucketLogo,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.OAUTH_BRIDGE_INTEGRATION,
    urlSlug: "oauth-bridge",
    key: "oauth_bridge",
    title: "OAuth Bridge",
    logoUrl: OAuthBridgeLogo,
    beta: true,
  },
];

// eslint-disable-next-line react/only-export-components
export const getInternalApps = (supportedIntegrations: E_INTEGRATION_KEYS[]): TUserApplication[] => {
  const internalApps: TUserApplication[] = [];

  INTEGRATIONS_LIST.forEach((integration) => {
    internalApps.push({
      id: integration.key,
      name: integration.title,
      slug: integration.urlSlug,
      short_description: `${integration.key}_integration.description`,
      logo_url: integration.logoUrl,
      is_owned: false,
      is_not_supported: !supportedIntegrations.includes(integration.key.toUpperCase() as E_INTEGRATION_KEYS),
      is_hardcoded: true,
      is_installed: true,
      installation_id: "",
      created_at: new Date().toISOString(),
      is_mentionable: false,
      website: "",
      description_html: "",
      company_name: "",
      redirect_uris: "",
      allowed_origins: "",
      attachments: [],
      categories: [],
      attachments_urls: [],
      privacy_policy_url: "",
      terms_of_service_url: "",
      is_default: true,
    });
  });

  return internalApps;
};

export const AppListRoot = observer(function AppListRoot(props: AppListProps) {
  const { supportedIntegrations, workspaceSlug } = props;
  const internalApps = getInternalApps(supportedIntegrations);
  const { getCanCreate } = useIntegrationPermissions();
  const canCreateIntegration = workspaceSlug ? getCanCreate(workspaceSlug) : false;
  // filter apps which has same slug as internal apps
  const apps = props.apps.filter((app) => !internalApps.some((internalApp) => internalApp.slug === app.slug));
  // update app is_owned to true if it's installed
  internalApps.forEach((app) => {
    const marketplaceApp = props.apps.find((a) => a.slug === app.slug);
    if (marketplaceApp) {
      app.is_owned = marketplaceApp.is_owned;
    }
  });
  const isInstalled = (app: TUserApplication) => app.is_installed;
  const isInternal = (app: TUserApplication) => app.is_internal;

  /**
   * Sort the apps by the following priority:
   * 1. Installed apps
   * 2. Internal apps
   * 3. Other apps
   */

  apps.sort((a, b) => {
    if (isInstalled(a) && isInstalled(b)) return 0;
    if (isInternal(a) && isInternal(b)) return 0;
    if (isInstalled(a)) return -1;
    if (isInternal(a)) return 1;
    return 0;
  });

  const allApps = [...internalApps, ...apps];

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="text-h6-medium">Apps</div>
          <div className="text-body-xs-regular text-tertiary">
            These integrations allow Plane to access external resources securely.
          </div>
        </div>
        {canCreateIntegration && (
          <Link to={`/${workspaceSlug}/settings/integrations/create`} className={getButtonStyling("primary", "lg")}>
            Build your own
          </Link>
        )}
      </div>
      <div className="overflow-y-auto">
        <AppList apps={allApps} />
      </div>
    </>
  );
});
