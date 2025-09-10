"use client";
import React from "react";
import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { E_INTEGRATION_KEYS, TUserApplication } from "@plane/types";
import { AppList } from "@/plane-web/components/marketplace";
import { TFeatureFlags } from "@/plane-web/types/feature-flag";

import GitHubLogo from "@/public/services/github.svg";
import GitlabLogo from "@/public/services/gitlab.svg";
import SentryLogo from "@/public/services/sentry.svg";
import SlackLogo from "@/public/services/slack.png";

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
      is_internal: true,
      is_not_supported: !supportedIntegrations.includes(integration.key.toUpperCase() as E_INTEGRATION_KEYS),
      is_hardcoded: true,
      is_installed: false,
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
    });
  });

  return internalApps;
};

export const AppListRoot: React.FC<AppListProps> = observer((props) => {
  const { apps, supportedIntegrations } = props;
  const { t } = useTranslation();
  const ownedApps = apps.filter((app) => app.is_owned);
  const internalApps = getInternalApps(supportedIntegrations);

  const allApps = apps
    .filter((app) => !app.is_owned)
    .filter((app) => !internalApps.some((internalApp) => internalApp.slug === app.slug));
  const installedApps = [...allApps, ...ownedApps].filter((app) => app.is_installed);
  installedApps.unshift(...internalApps);

  const yourApps = ownedApps.filter((app) => !app.is_installed);

  return (
    <div className="flex w-full h-full mt-5 flex-col space-y-8">
      {installedApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-custom-text-100">
            {t("workspace_settings.settings.applications.installed_apps")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AppList apps={installedApps} />
          </div>
        </div>
      )}

      {allApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-custom-text-100">
            {t("workspace_settings.settings.applications.all_apps")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AppList apps={allApps} />
          </div>
        </div>
      )}

      {yourApps.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-custom-text-100">
            {t("workspace_settings.settings.applications.internal_apps")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AppList apps={yourApps} />
          </div>
        </div>
      )}
    </div>
  );
});
