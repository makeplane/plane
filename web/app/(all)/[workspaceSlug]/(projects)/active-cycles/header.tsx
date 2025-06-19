"use client";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Breadcrumbs, ContrastIcon, Header, BetaBadge } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane web components
import { UpgradeBadge } from "@/plane-web/components/workspace";

export const WorkspaceActiveCycleHeader = observer(() => {
  const { t } = useTranslation();
  return (
    <Header>
      <Header.LeftItem>
        <div className="flex gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t("active_cycles")}
                  icon={<ContrastIcon className="h-4 w-4 text-custom-text-300 rotate-180" />}
                />
              }
            />
          </Breadcrumbs>
          <BetaBadge />
        </div>
        <UpgradeBadge size="md" flag="WORKSPACE_ACTIVE_CYCLES" />
      </Header.LeftItem>
    </Header>
  );
});
