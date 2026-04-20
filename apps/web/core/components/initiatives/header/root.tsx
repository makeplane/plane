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

import { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { InitiativeIcon, ScopeIcon, OverviewIcon } from "@plane/propel/icons";
import type { ICustomSearchSelectOption } from "@plane/types";
import { EInitiativeNavigationItem } from "@plane/types";
import { BreadcrumbNavigationDropdown, BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { InitiativeQuickActions } from "@/components/initiatives/components/quick-actions";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeOverviewHeaderActions } from "./actions/overview-header-actions";
import { InitiativeScopeHeaderActions } from "./actions/scope-header-actions";

type TInitiativesDetailsHeaderProps = {
  workspaceSlug: string;
  initiativeId: string;
  selectedNavigationKey: EInitiativeNavigationItem;
};

export const InitiativesDetailsHeader = observer(function InitiativesDetailsHeader(
  props: TInitiativesDetailsHeaderProps
) {
  // params
  const { workspaceSlug, initiativeId, selectedNavigationKey } = props;
  // router
  const router = useAppRouter();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    initiative: { getInitiativeById, initiativeIds, permissions },
  } = useInitiatives();
  const { t } = useTranslation();
  // derived values
  const initiativesDetails = getInitiativeById(initiativeId);

  const switcherOptions = initiativeIds
    ?.map((id) => {
      const _initiative = getInitiativeById(id);
      if (!_initiative?.id || !_initiative?.name) return null;
      return {
        value: _initiative.id,
        query: _initiative.name,
        content: (
          <Link href={`/${workspaceSlug}/initiatives/${_initiative.id}`}>
            <SwitcherLabel
              name={_initiative.name}
              logo_props={_initiative.logo_props}
              LabelIcon={InitiativeIcon}
              type="lucide"
            />
          </Link>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  const DETAIL_OPTIONS = useMemo(
    () => [
      {
        key: EInitiativeNavigationItem.OVERVIEW,
        title: t("initiatives.overview"),
        action: () => router.push(`/${workspaceSlug}/initiatives/${initiativeId}/`),
        icon: OverviewIcon,
      },
      {
        key: EInitiativeNavigationItem.SCOPE,
        title: t("initiatives.scope.label"),
        action: () => router.push(`/${workspaceSlug}/initiatives/${initiativeId}/scope`),
        icon: ScopeIcon,
      },
    ],
    [workspaceSlug, initiativeId, router, t]
  );

  const activeDetailOption = DETAIL_OPTIONS.find((option) => option.key === selectedNavigationKey);

  const INITIATIVE_HEADER_ACTIONS = useMemo(
    () => ({
      [EInitiativeNavigationItem.OVERVIEW]: <InitiativeOverviewHeaderActions />,
      [EInitiativeNavigationItem.SCOPE]: <InitiativeScopeHeaderActions initiativeId={initiativeId} />,
    }),
    [initiativeId]
  );

  if (!activeDetailOption) return null;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back}>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("initiatives.label")}
                href={`/${workspaceSlug}/initiatives`}
                icon={<InitiativeIcon className="size-4" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbNavigationSearchDropdown
                selectedItem={initiativeId}
                navigationItems={switcherOptions}
                onChange={(value: string) => {
                  router.push(`/${workspaceSlug}/initiatives/${value}`);
                }}
                title={initiativesDetails?.name}
                icon={
                  <Breadcrumbs.Icon>
                    {initiativesDetails?.logo_props?.in_use ? (
                      <Logo logo={initiativesDetails?.logo_props} size={16} type="lucide" />
                    ) : (
                      <InitiativeIcon className="size-4 flex-shrink-0 text-tertiary" />
                    )}
                  </Breadcrumbs.Icon>
                }
                isLast
              />
            }
            showSeparator={false}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbNavigationDropdown
                selectedItemKey={activeDetailOption.key}
                navigationItems={DETAIL_OPTIONS}
                isLast
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        {initiativesDetails && (
          <div ref={parentRef} className="flex items-center gap-2">
            {INITIATIVE_HEADER_ACTIONS[selectedNavigationKey]}
            <InitiativeQuickActions
              workspaceSlug={workspaceSlug}
              parentRef={parentRef}
              initiative={initiativesDetails}
              permissions={{
                canEdit: permissions.getCanEdit(workspaceSlug, initiativeId),
                canDelete: permissions.getCanDelete(workspaceSlug, initiativeId),
              }}
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
