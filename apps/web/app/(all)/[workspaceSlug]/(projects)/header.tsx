/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { HomeOutline, WidgetOutline } from "@makeplane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
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
                  <BreadcrumbLink label={t("home.title")} icon={<HomeOutline className="h-4 w-4 text-tertiary" />} />
                }
              />
            </Breadcrumbs>
          </div>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="my-auto mb-0 md:hidden">
            <IconButton
              variant="secondary"
              size="md"
              onClick={() => toggleWidgetSettings(true)}
              icon={<Icon icon={WidgetOutline} />}
              aria-label={t("home.manage_widgets")}
            />
          </div>
          <div className="my-auto mb-0 hidden md:block">
            <Button
              variant="secondary"
              size="md"
              stretch="auto"
              onClick={() => toggleWidgetSettings(true)}
              icon={<Icon icon={WidgetOutline} />}
              label={t("home.manage_widgets")}
            />
          </div>
        </Header.RightItem>
      </Header>
    </>
  );
});
