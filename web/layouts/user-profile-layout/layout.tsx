import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
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

  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  if (!currentWorkspaceRole) return null;

  const isAuthorized = AUTHORIZED_ROLES.includes(currentWorkspaceRole);

  return (
    <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
      <ProfileSidebar />
      <div className="md:h-full w-full flex flex-col md:overflow-hidden">
        <ProfileNavbar isAuthorized={isAuthorized} showProfileIssuesFilter={showProfileIssuesFilter} />
        {isAuthorized ? (
          <div className={`md:h-full w-full overflow-hidden ${className}`}>{children}</div>
        ) : (
          <div className="h-full w-full grid place-items-center text-custom-text-200">
            You do not have the permission to access this page.
          </div>
        )}
      </div>
    </div>
  );
});
