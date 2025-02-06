"use client";

import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// components
import { PROFILE_VIEWER_TAB, PROFILE_ADMINS_TAB, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProfileSidebar } from "@/components/profile";
// constants
import { USER_PROFILE_PROJECT_SEGREGATION } from "@/constants/fetch-keys";
// hooks
import { useUserPermissions } from "@/hooks/store";
import useSize from "@/hooks/use-window-size";
// local components
import { UserService } from "@/services/user.service";
import { UserProfileHeader } from "./header";
import { ProfileIssuesMobileHeader } from "./mobile-header";
import { ProfileNavbar } from "./navbar";

const userService = new UserService();

type Props = {
  children: React.ReactNode;
};

const UseProfileLayout: React.FC<Props> = observer((props) => {
  const { children } = props;
  // router
  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  // derived values
  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const windowSize = useSize();
  const isSmallerScreen = windowSize[0] >= 768;

  const { data: userProjectsData } = useSWR(
    workspaceSlug && userId ? USER_PROFILE_PROJECT_SEGREGATION(workspaceSlug.toString(), userId.toString()) : null,
    workspaceSlug && userId
      ? () => userService.getUserProfileProjectsSegregation(workspaceSlug.toString(), userId.toString())
      : null
  );
  // derived values
  const isAuthorizedPath =
    pathname.includes("assigned") || pathname.includes("created") || pathname.includes("subscribed");
  const isIssuesTab = pathname.includes("assigned") || pathname.includes("created") || pathname.includes("subscribed");

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;
  const currentTab = tabsList.find((tab) => pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`);

  return (
    <>
      {/* Passing the type prop from the current route value as we need the header as top most component.
      TODO: We are depending on the route path to handle the mobile header type. If the path changes, this logic will break. */}
      <div className="h-full w-full flex flex-col md:flex-row overflow-hidden">
        <div className="h-full w-full flex flex-col overflow-hidden">
          <AppHeader
            header={
              <UserProfileHeader
                type={currentTab?.i18n_label}
                userProjectsData={userProjectsData}
                showProfileIssuesFilter={isIssuesTab}
              />
            }
            mobileHeader={isIssuesTab && <ProfileIssuesMobileHeader />}
          />
          <ContentWrapper>
            <div className="h-full w-full flex flex-row md:flex-col  md:overflow-hidden">
              <div className="flex w-full flex-col md:h-full md:overflow-hidden">
                <ProfileNavbar isAuthorized={!!isAuthorized} />
                {isAuthorized || !isAuthorizedPath ? (
                  <div className={`w-full overflow-hidden h-full`}>{children}</div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-custom-text-200">
                    {t("you_do_not_have_the_permission_to_access_this_page")}
                  </div>
                )}
              </div>
              {!isSmallerScreen && <ProfileSidebar userProjectsData={userProjectsData} />}
            </div>
          </ContentWrapper>
        </div>
        {isSmallerScreen && <ProfileSidebar userProjectsData={userProjectsData} />}
      </div>
    </>
  );
});

export default UseProfileLayout;
