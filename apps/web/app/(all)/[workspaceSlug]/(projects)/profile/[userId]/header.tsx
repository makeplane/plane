/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// ui
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownOutline, RightSidePaneOutline, YourWorkOutline } from "@makeplane/propel/icons";
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { IUserProfileProjectSegregation } from "@plane/types";
import { Breadcrumbs } from "@plane/blocks/breadcrumb";
import { Header } from "@plane/blocks/layout";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { cn } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ProfileIssuesFilter } from "@/components/profile/profile-issues-filter";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUser, useUserPermissions } from "@/hooks/store/user";

type TUserProfileHeader = {
  userProjectsData: IUserProfileProjectSegregation | undefined;
  type?: string | undefined;
  showProfileIssuesFilter?: boolean;
};

export const UserProfileHeader = observer(function UserProfileHeader(props: TUserProfileHeader) {
  const { userProjectsData, type = undefined, showProfileIssuesFilter } = props;
  // router
  const { workspaceSlug, userId } = useParams();
  const router = useRouter();
  // store hooks
  const { toggleProfileSidebar, profileSidebarCollapsed } = useAppTheme();
  const { data: currentUser } = useUser();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  // derived values
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!workspaceUserInfo) return null;

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  const userName = `${userProjectsData?.user_data?.first_name} ${userProjectsData?.user_data?.last_name}`;

  const isCurrentUser = currentUser?.id === userId;

  const breadcrumbLabel = isCurrentUser ? t("profile.page_label") : `${userName} ${t("profile.work")}`;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={breadcrumbLabel}
                disableTooltip
                icon={<YourWorkOutline className="h-4 w-4 text-tertiary" />}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="hidden md:flex md:items-center">{showProfileIssuesFilter && <ProfileIssuesFilter />}</div>
        <div className="flex gap-4 md:hidden">
          <Menu>
            <MenuTrigger
              render={
                <button
                  type="button"
                  className="flex grow items-center justify-center gap-2 rounded-md border border-subtle px-2 py-1.5 text-13 text-secondary"
                />
              }
            >
              <span className="flex grow justify-center text-13 text-secondary">{type ? t(type) : null}</span>
              <ChevronDownOutline className="h-4 w-4 text-placeholder" />
            </MenuTrigger>
            <MenuContent side="bottom" align="start">
              {tabsList.map((tab) => (
                <MenuItem
                  key={tab.route}
                  label={t(tab.i18n_label)}
                  onClick={() => router.push(`/${workspaceSlug}/profile/${userId}/${tab.route}`)}
                />
              ))}
            </MenuContent>
          </Menu>
          <div className="shrink-0 md:hidden">
            <IconButton
              variant="ghost"
              size="md"
              aria-label={t(
                profileSidebarCollapsed
                  ? "aria_labels.projects_sidebar.expand_sidebar"
                  : "aria_labels.projects_sidebar.collapse_sidebar"
              )}
              onClick={() => {
                toggleProfileSidebar();
              }}
              icon={
                <Icon
                  icon={
                    <RightSidePaneOutline
                      className={cn("size-4", !profileSidebarCollapsed ? "text-accent-primary" : "text-secondary")}
                    />
                  }
                />
              }
            />
          </div>
        </div>
      </Header.RightItem>
    </Header>
  );
});
