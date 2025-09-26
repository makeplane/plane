"use client";
import React from "react";
import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { E_INTEGRATION_KEYS, TUserApplication } from "@plane/types";
import { AppList } from "@/plane-web/components/marketplace";
import { TFeatureFlags } from "@/plane-web/types/feature-flag";

import GitHubLogo from "@/public/logos/integrations/github.png";
import GitlabLogo from "@/public/logos/integrations/gitlab.png";
import SentryLogo from "@/public/logos/integrations/sentry.png";
import SlackLogo from "@/public/logos/integrations/slack.png";

// list all the applications
// have tabs to filter by category
// have search bar to search by name

type AppListProps = {
  apps: TUserApplication[];
  supportedIntegrations: E_INTEGRATION_KEYS[];
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
    logoUrl: GitHubLogo.src,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_INTEGRATION,
    urlSlug: "gitlab",
    key: "gitlab",
    title: "GitLab",
    logoUrl: GitlabLogo.src,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SLACK_INTEGRATION,
    urlSlug: "slack",
    key: "slack",
    title: "Slack",
    logoUrl: SlackLogo.src,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.SENTRY_INTEGRATION,
    urlSlug: "sentry",
    key: "sentry",
    title: "Sentry",
    logoUrl: SentryLogo.src,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITHUB_ENTERPRISE_INTEGRATION,
    urlSlug: "github-enterprise",
    key: "github_enterprise",
    title: "GitHub Enterprise",
    logoUrl: GitHubLogo.src,
    beta: true,
  },
  {
    flag: E_FEATURE_FLAGS.GITLAB_ENTERPRISE_INTEGRATION,
    urlSlug: "gitlab-enterprise",
    key: "gitlab_enterprise",
    title: "GitLab Enterprise",
    logoUrl: GitlabLogo.src,
    beta: true,
  },
];

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

export const AppListRoot: React.FC<AppListProps> = observer((props) => {
  const { supportedIntegrations } = props;
  const internalApps = getInternalApps(supportedIntegrations);
  // filter apps which has same slug as internal apps
  const apps = props.apps.filter((app) => !internalApps.some((internalApp) => internalApp.slug === app.slug));
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AppList apps={allApps} />
    </div>
  );
});
