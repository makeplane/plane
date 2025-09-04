"use client";
import { useMemo, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Rss } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { InitiativeIcon, ScopeIcon } from "@plane/propel/icons";
import { ICustomSearchSelectOption, EInitiativeNavigationItem, EUserWorkspaceRoles } from "@plane/types";
import {
  BreadcrumbNavigationDropdown,
  BreadcrumbNavigationSearchDropdown,
  Breadcrumbs,
  Header,
} from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { Logo } from "@/components/common/logo";
import { SwitcherLabel } from "@/components/common/switcher-label";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { InitiativeQuickActions } from "@/plane-web/components/initiatives/components/quick-actions";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { InitiativeOverviewHeaderActions } from "./actions/overview-header-actions";
import { InitiativeScopeHeaderActions } from "./actions/scope-header-actions";

type TInitiativesDetailsHeaderProps = {
  selectedNavigationKey: EInitiativeNavigationItem;
};

export const InitiativesDetailsHeader = observer((props: TInitiativesDetailsHeaderProps) => {
  // params
  const { selectedNavigationKey } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug, initiativeId } = useParams();
  // ref
  const parentRef = useRef<HTMLDivElement>(null);
  // store hooks
  const {
    initiative: { getInitiativeById, initiativeIds },
  } = useInitiatives();
  const { allowPermissions } = useUserPermissions();

  const { t } = useTranslation();
  // derived values
  const initiativesDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : undefined;

  const hasWorkspaceMemberLevelPermissions = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

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
        icon: Rss,
      },
      {
        key: EInitiativeNavigationItem.SCOPE,
        title: t("initiatives.scope.label"),
        action: () => router.push(`/${workspaceSlug}/initiatives/${initiativeId}/scope`),
        icon: ScopeIcon,
      },
    ],
    [workspaceSlug, initiativeId, router]
  );

  const activeDetailOption = DETAIL_OPTIONS.find((option) => option.key === selectedNavigationKey);

  const INITIATIVE_HEADER_ACTIONS = useMemo(
    () => ({
      [EInitiativeNavigationItem.OVERVIEW]: <InitiativeOverviewHeaderActions />,
      [EInitiativeNavigationItem.SCOPE]: (
        <InitiativeScopeHeaderActions
          workspaceSlug={workspaceSlug?.toString()}
          initiativeId={initiativeId?.toString()}
          disabled={!hasWorkspaceMemberLevelPermissions}
        />
      ),
    }),
    [initiativeId, workspaceSlug, hasWorkspaceMemberLevelPermissions]
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
                selectedItem={initiativeId.toString()}
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
                      <InitiativeIcon className="size-4 flex-shrink-0 text-custom-text-300" />
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
              workspaceSlug={workspaceSlug.toString()}
              parentRef={parentRef}
              initiative={initiativesDetails}
              customClassName="p-2 rounded outline-none hover:bg-custom-sidebar-background-80 bg-custom-background-80/70"
            />
          </div>
        )}
      </Header.RightItem>
    </Header>
  );
});
