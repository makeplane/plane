"use client";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// ui
import { ContrastIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// plane web components
import { UpgradeBadge } from "@/plane-web/components/workspace/upgrade-badge";

export const WorkspaceActiveCycleHeader = observer(() => {
  const { t } = useTranslation();
  return (
    <Header>
      <Header.LeftItem>
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
        <UpgradeBadge size="md" />
      </Header.LeftItem>
    </Header>
  );
});
