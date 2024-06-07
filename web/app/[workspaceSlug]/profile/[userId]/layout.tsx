"use client";

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
// components
import { ProfileSidebar } from "@/components/profile";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";
// hooks
import { useUser } from "@/hooks/store";
// local components
import { ProfileNavbar } from "./navbar";

type Props = {
  children: React.ReactNode;
};

const AUTHORIZED_ROLES = [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.VIEWER];

const ProfileAuthWrapper: React.FC<Props> = observer((props) => {
  const { children } = props;
  // router
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

  return (
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
  );
});

export default ProfileAuthWrapper;
