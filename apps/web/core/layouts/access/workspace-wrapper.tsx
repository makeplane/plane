import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { useUserPermissions } from "@/hooks/store/user";
interface IWorkspaceAuthWrapper {
  children: React.ReactNode;
  pageKey: string;
  allowedPermissions?: EUserPermissions[];
}

const WorkspaceAccessWrapper = ({ children, ...props }: IWorkspaceAuthWrapper) => {
  const { pageKey, allowedPermissions } = props;
  // router
  const { workspaceSlug } = useParams();
  // store
  const { hasPageAccess, allowPermissions } = useUserPermissions();
  // derived values
  const isAuthorized = allowedPermissions
    ? allowPermissions(allowedPermissions, EUserPermissionsLevel.WORKSPACE, workspaceSlug?.toString())
    : hasPageAccess(workspaceSlug?.toString() ?? "", pageKey);
  // render
  if (!isAuthorized) return <NotAuthorizedView />;
  return <>{children}</>;
};

export default WorkspaceAccessWrapper;
