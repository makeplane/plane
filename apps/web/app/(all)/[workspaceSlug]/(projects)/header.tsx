/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Shapes } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { HomeIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useHome } from "@/hooks/store/use-home";

export const WorkspaceDashboardHeader = observer(function WorkspaceDashboardHeader() {
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
                  <BreadcrumbLink label={t("home.title")} icon={<HomeIcon className="h-4 w-4 text-tertiary" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <span className="my-auto mb-0 hidden md:inline-flex">
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              onClick={() => toggleWidgetSettings(true)}
              icon={<Shapes />}
              label={t("home.manage_widgets")}
            />
          </span>
          <span className="my-auto mb-0 md:hidden">
            <IconButton
              variant="secondary"
              size="md"
              aria-label={t("home.manage_widgets")}
              icon={<Shapes />}
              onClick={() => toggleWidgetSettings(true)}
            />
          </span>
        </Header.RightItem>
      </Header>
    </>
  );
});
