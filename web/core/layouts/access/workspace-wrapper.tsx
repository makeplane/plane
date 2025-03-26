import { useParams } from "next/navigation";
import { NotAuthorizedView } from "@/components/auth-screens";
import { useUserPermissions } from "@/hooks/store";

interface IWorkspaceAuthWrapper {
  children: React.ReactNode;
  pageKey: string;
}

const WorkspaceAccessWrapper = ({ children, ...props }: IWorkspaceAuthWrapper) => {
  const { pageKey } = props;
  // router
  const { workspaceSlug } = useParams();
  // store
  const { hasPageAccess } = useUserPermissions();
  // derived values
  const isAuthorized = hasPageAccess(workspaceSlug?.toString() ?? "", pageKey);
  // render
  if (!isAuthorized) return <NotAuthorizedView />;
  return <>{children}</>;
};

export default WorkspaceAccessWrapper;
