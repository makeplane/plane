"use client";
import React from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { TUserApplication } from "@plane/types";
import { Tabs } from "@plane/ui";
import { AppList } from "@/plane-web/components/marketplace";

// list all the applications
// have tabs to filter by category
// have search bar to search by name

type AppListProps = {
  apps: TUserApplication[];
};

export const AppListRoot: React.FC<AppListProps> = observer((props) => {
  const { apps } = props;
  const { t } = useTranslation();
  const ownedApps = apps.filter((app) => app.is_owned);
  const thirdPartyApps = apps.filter((app) => !app.is_owned);

  const APP_LIST_TABS = [
    {
      key: "third_party",
      label: t("workspace_settings.settings.applications.third_party_apps"),
      content: <AppList apps={thirdPartyApps} />,
    },
    {
      key: "own",
      label: t("workspace_settings.settings.applications.your_apps"),
      content: <AppList apps={ownedApps} />,
    },
  ];

  return (
    <div className="flex w-full h-full">
      <Tabs
        tabs={APP_LIST_TABS}
        storageKey={`app-list`}
        defaultTab="own"
        size="sm"
        tabListContainerClassName="py-2 divide-x divide-custom-border-200"
        tabListClassName="my-2 max-w-64"
        tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
      />
    </div>
  );
});
