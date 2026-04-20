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

// ui
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { PanelRight } from "lucide-react";
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { YourWorkIcon, ChevronDownIcon } from "@plane/propel/icons";
import type { IUserProfileProjectSegregation } from "@plane/types";
import { Breadcrumbs, Header, CustomMenu } from "@plane/ui";
import { isGuestRole } from "@plane/utils";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { ProfileIssuesFilter } from "@/components/profile/profile-issues-filter";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUser } from "@/hooks/store/user";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";

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
  const { getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  const { t } = useTranslation();
  // derived values
  const canViewProfileWorkItemTabs = workspaceSlug
    ? !isGuestRole(getCurrentUserWorkspaceRoleSlug(workspaceSlug))
    : false;
  const tabsList = canViewProfileWorkItemTabs ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

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
                icon={<YourWorkIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="hidden md:flex md:items-center">{showProfileIssuesFilter && <ProfileIssuesFilter />}</div>
        <div className="flex gap-4 md:hidden">
          <CustomMenu
            maxHeight={"md"}
            className="flex grow justify-center text-13 text-secondary"
            placement="bottom-start"
            customButton={
              <div className="flex items-center gap-2 rounded-md border border-subtle px-2 py-1.5">
                <span className="flex grow justify-center text-13 text-secondary">{type}</span>
                <ChevronDownIcon className="h-4 w-4 text-placeholder" />
              </div>
            }
            customButtonClassName="flex grow justify-center text-secondary text-13"
            closeOnSelect
          >
            <></>
            {tabsList.map((tab) => (
              <CustomMenu.MenuItem
                className="flex items-center gap-2"
                key={tab.route}
                onClick={() => router.push(`/${workspaceSlug}/profile/${userId}/${tab.route}`)}
              >
                <span className="w-full text-tertiary">{t(tab.i18n_label)}</span>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
          <div className="shrink-0 md:hidden">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                toggleProfileSidebar();
              }}
              appendIcon={
                <PanelRight className={!profileSidebarCollapsed ? "text-accent-primary" : "text-secondary"} />
              }
            ></Button>
          </div>
        </div>
      </Header.RightItem>
    </Header>
  );
});
