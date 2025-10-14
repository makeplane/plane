"use client";

import { observer } from "mobx-react";
import { Shapes } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { HomeIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useHome } from "@/hooks/store/use-home";
// local imports
import { StarUsOnGitHubLink } from "./star-us-link";

export const WorkspaceDashboardHeader = observer(() => {
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { toggleWidgetSettings } = useHome();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <div className="flex items-center gap-2">
            <Breadcrumbs>
              <Breadcrumbs.Item
                component={
                  <BreadcrumbLink
                    label={t("home.title")}
                    icon={<HomeIcon className="h-4 w-4 text-custom-text-300" />}
                  />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => toggleWidgetSettings(true)}
            className="my-auto mb-0"
          >
            <Shapes size={16} />
            <div className="hidden text-xs font-medium sm:hidden md:block">{t("home.manage_widgets")}</div>
          </Button>
          <StarUsOnGitHubLink />
        </Header.RightItem>
      </Header>
    </>
  );
});
