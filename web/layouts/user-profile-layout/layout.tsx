import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// components
import { ProfileNavbar, ProfileSidebar } from "@/components/profile";
// hooks
import { useUser } from "@/hooks/store";
// constants
import { EUserWorkspaceRoles } from "@/constants/workspace";

type Props = {
  children: React.ReactNode;
  className?: string;
  showProfileIssuesFilter?: boolean;
};

const AUTHORIZED_ROLES = [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.VIEWER];

export const ProfileAuthWrapper: React.FC<Props> = observer((props) => {
  const { children, className, showProfileIssuesFilter } = props;
  // router
  const router = useRouter();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const isAuthorized = currentWorkspaceRole && AUTHORIZED_ROLES.includes(currentWorkspaceRole);
  const isAuthorizedPath = router.pathname.includes("assigned" || "created" || "subscribed");

  return (
    <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
      <ProfileSidebar />
      <div className="flex w-full flex-col md:h-full md:overflow-hidden">
        <ProfileNavbar isAuthorized={!!isAuthorized} showProfileIssuesFilter={showProfileIssuesFilter} />
        {isAuthorized || !isAuthorizedPath ? (
          <div className={`w-full overflow-hidden md:h-full ${className}`}>{children}</div>
        ) : (
          <div className="grid h-full w-full place-items-center text-custom-text-200">
            You do not have the permission to access this page.
          </div>
        )}
      </div>
    </div>
  );
});
