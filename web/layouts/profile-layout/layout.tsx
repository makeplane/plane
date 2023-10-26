import useSWR from "swr";
import { useRouter } from "next/router";
// services
import { WorkspaceService } from "services/workspace.service";
// components
import { ProfileNavbar, ProfileSidebar } from "components/profile";
// constants
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

type Props = {
  children: React.ReactNode;
  className?: string;
};

// services
const workspaceService = new WorkspaceService();

export const ProfileAuthWrapper: React.FC<Props> = ({ children, className }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: memberDetails } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  const isAuthorized = memberDetails?.role === 20 || memberDetails?.role === 15 || memberDetails?.role === 10;

  return (
    <div className="h-full w-full md:flex md:flex-row-reverse md:overflow-hidden">
      <ProfileSidebar />
      <div className="md:h-full w-full flex flex-col md:overflow-hidden">
        <ProfileNavbar isAuthorized={isAuthorized} />
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
};
