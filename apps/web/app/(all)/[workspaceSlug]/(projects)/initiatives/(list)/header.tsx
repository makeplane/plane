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
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { InitiativeIcon } from "@plane/propel/icons";
// ui
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { LayoutSwitcher } from "@/components/base-layouts/layout-switcher";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useAppRouter } from "@/hooks/use-app-router";
// Plane-web
import { InitiativesFiltersToggle } from "@/components/initiatives/components/rich-filters/toggle";
import { HeaderFilters } from "@/components/initiatives/header/filters";
import { DEFAULT_INITIATIVE_LAYOUT } from "@/constants/initiative";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

export const InitiativesListHeader = observer(function InitiativesListHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  const { toggleCreateInitiativeModal } = useCommandPalette();
  const {
    initiative: { permissions },
    initiativeFilters: { currentInitiativeDisplayFilters, updateDisplayFilters },
  } = useInitiatives();
  // derived values
  const displayFilters = currentInitiativeDisplayFilters;
  const activeLayout = displayFilters.layout;
  // translation
  const { t } = useTranslation();

  return (
    <>
      <Header>
        <Header.LeftItem>
          <Breadcrumbs onBack={() => router.back()}>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label={t("initiatives.label")} icon={<InitiativeIcon className="h-4 w-4" />} />
              }
            />
          </Breadcrumbs>
        </Header.LeftItem>
        <Header.RightItem>
          <div className="hidden gap-2 md:flex">
            <LayoutSwitcher
              selectedLayout={activeLayout || DEFAULT_INITIATIVE_LAYOUT}
              onChange={(layout) => updateDisplayFilters(workspaceSlug.toString(), { layout })}
            />
            <InitiativesFiltersToggle />
            <HeaderFilters workspaceSlug={workspaceSlug.toString()} />
          </div>
          {permissions.getCanCreate(workspaceSlug) && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => toggleCreateInitiativeModal({ isOpen: true, initiativeId: undefined })}
            >
              <div className="hidden sm:block">{t("add")}</div> {t("initiatives.label")}
            </Button>
          )}
        </Header.RightItem>
      </Header>
    </>
  );
});
