"use client";

// ui
import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, PanelRight } from "lucide-react";
import { IUserProfileProjectSegregation } from "@plane/types";
import { Breadcrumbs, Header, CustomMenu, UserActivityIcon } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common";
// components
import { ProfileIssuesFilter } from "@/components/profile";
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "@/constants/profile";
import { cn } from "@/helpers/common.helper";
import { useAppTheme, useUser, useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type TUserProfileHeader = {
  userProjectsData: IUserProfileProjectSegregation | undefined;
  type?: string | undefined;
  showProfileIssuesFilter?: boolean;
};

export const UserProfileHeader: FC<TUserProfileHeader> = observer((props) => {
  const { userProjectsData, type = undefined, showProfileIssuesFilter } = props;
  // router
  const { workspaceSlug, userId } = useParams();
  // store hooks
  const { toggleProfileSidebar, profileSidebarCollapsed } = useAppTheme();
  const { data: currentUser } = useUser();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  // derived values
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  if (!workspaceUserInfo) return null;

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;

  const userName = `${userProjectsData?.user_data?.first_name} ${userProjectsData?.user_data?.last_name}`;

  const isCurrentUser = currentUser?.id === userId;

  const breadcrumbLabel = `${isCurrentUser ? "Your" : userName} Work`;

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                label={breadcrumbLabel}
                disableTooltip
                icon={<UserActivityIcon className="h-4 w-4 text-custom-text-300" />}
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
            className="flex flex-grow justify-center text-sm text-custom-text-200"
            placement="bottom-start"
            customButton={
              <div className="flex items-center gap-2 rounded-md border border-custom-border-200 px-2 py-1.5">
                <span className="flex flex-grow justify-center text-sm text-custom-text-200">{type}</span>
                <ChevronDown className="h-4 w-4 text-custom-text-400" />
              </div>
            }
            customButtonClassName="flex flex-grow justify-center text-custom-text-200 text-sm"
            closeOnSelect
          >
            <></>
            {tabsList.map((tab) => (
              <CustomMenu.MenuItem className="flex items-center gap-2" key={tab.route}>
                <Link
                  key={tab.route}
                  href={`/${workspaceSlug}/profile/${userId}/${tab.route}`}
                  className="w-full text-custom-text-300"
                >
                  {tab.label}
                </Link>
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
          <button
            className="block transition-all md:hidden"
            onClick={() => {
              toggleProfileSidebar();
            }}
          >
            <PanelRight
              className={cn(
                "block h-4 w-4 md:hidden",
                !profileSidebarCollapsed ? "text-[#3E63DD]" : "text-custom-text-200"
              )}
            />
          </button>
        </div>
      </Header.RightItem>
    </Header>
  );
});
