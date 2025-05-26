"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Settings } from "lucide-react";
// ui
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// hooks
import { useWorkspace } from "@/hooks/store";

export const WorkspaceSettingHeader: FC = observer(() => {
  const { currentWorkspace, loader } = useWorkspace();
  const { t } = useTranslation();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader}>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                href={`/${currentWorkspace?.slug}/settings`}
                label={currentWorkspace?.name ?? "Workspace"}
                icon={<Settings className="h-4 w-4 text-custom-text-300" />}
              />
            }
          />
          <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label={t("settings")} />} />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
