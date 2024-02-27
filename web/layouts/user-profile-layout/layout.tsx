import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// hooks
import { useUser } from "hooks/store";
// components
import { ProfileNavbar, ProfileSidebar } from "components/profile";

type Props = {
  children: React.ReactNode;
  className?: string;
  showProfileIssuesFilter?: boolean;
};

const AUTHORIZED_ROLES = [20, 15, 10];

export const ProfileAuthWrapper: React.FC<Props> = observer((props) => {
  const { children, className, showProfileIssuesFilter } = props;
  const router = useRouter();

  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  if (!currentWorkspaceRole) return null;

  const isAuthorized = AUTHORIZED_ROLES.includes(currentWorkspaceRole);

  const isAuthorizedPath = router.pathname.includes("assigned" || "created" || "subscribed");

  return (
    <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
      <ProfileSidebar />
      <div className="flex w-full flex-col md:h-full md:overflow-hidden">
        <ProfileNavbar isAuthorized={isAuthorized} showProfileIssuesFilter={showProfileIssuesFilter} />
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
