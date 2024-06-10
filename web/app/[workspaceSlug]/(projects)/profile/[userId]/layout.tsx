"use client";

import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
import { ProfileSidebar } from "@/components/profile";
// constants
import { PROFILE_ADMINS_TAB, PROFILE_VIEWER_TAB } from "@/constants/profile";
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser } from "@/hooks/store";
// local components
import { UserProfileHeader } from "./header";
import { ProfileIssuesMobileHeader } from "./mobile-header";
import { ProfileNavbar } from "./navbar";

type Props = {
  children: React.ReactNode;
};

const AUTHORIZED_ROLES = [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.VIEWER];

const UseProfileLayout: React.FC<Props> = observer((props) => {
  const { children } = props;
  // router
  const { workspaceSlug, userId } = useParams();
  const pathname = usePathname();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const isAuthorized = currentWorkspaceRole && AUTHORIZED_ROLES.includes(currentWorkspaceRole);
  const isAuthorizedPath =
    pathname.includes("assigned") || pathname.includes("created") || pathname.includes("subscribed");
  const isIssuesTab = pathname.includes("assigned") || pathname.includes("created") || pathname.includes("subscribed");

  const tabsList = isAuthorized ? [...PROFILE_VIEWER_TAB, ...PROFILE_ADMINS_TAB] : PROFILE_VIEWER_TAB;
  const currentTab = tabsList.find((tab) => pathname === `/${workspaceSlug}/profile/${userId}${tab.selected}`);

  return (
    <>
      {/* Passing the type prop from the current route value as we need the header as top most component.
      TODO: We are depending on the route path to handle the mobile header type. If the path changes, this logic will break. */}
      <AppHeader
        header={<UserProfileHeader type={currentTab?.label} />}
        mobileHeader={isIssuesTab && <ProfileIssuesMobileHeader />}
      />
      <ContentWrapper>
        <div className="h-full w-full flex md:overflow-hidden">
          <div className="flex w-full flex-col md:h-full md:overflow-hidden">
            <ProfileNavbar isAuthorized={!!isAuthorized} showProfileIssuesFilter={isIssuesTab} />
            {isAuthorized || !isAuthorizedPath ? (
              <div className={`w-full overflow-hidden md:h-full`}>{children}</div>
            ) : (
              <div className="grid h-full w-full place-items-center text-custom-text-200">
                You do not have the permission to access this page.
              </div>
            )}
          </div>
          <ProfileSidebar />
        </div>
      </ContentWrapper>
    </>
  );
});

export default UseProfileLayout;
