import useUser from "hooks/use-user";

// hooks
import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// services
import workspaceServices from "services/workspace.service";
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

type Props = {
  children: React.ReactNode;
};

const WorkspaceAuthorizationLayout: React.FC<Props> = (props) => {
  const { children } = props;

  const router = useRouter();

  const user = useUser();
  const { workspaceSlug } = router.query;

  const { data: workspaceMemberMe, error } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug as string) : null,
    workspaceSlug ? () => workspaceServices.workspaceMemberMe(workspaceSlug.toString()) : null,
    {
      onErrorRetry(err, key, config, revalidate, revalidateOpts) {
        if (err.status === 401 || err.status === 403) return;
        revalidateOpts.retryCount = 5;
      },
    }
  );

  if (!workspaceMemberMe && !error)
    // TODO: show good loading UI
    return (
      <div className="container h-screen flex justify-center items-center p-4 text-2xl font-semibold">
        <p>Loading...</p>
      </div>
    );

  if (error?.status === 401 || error?.status === 403) {
    // TODO:
    // [ ] - show proper UI with a button to redirect to get back to the workspace they have access to
    // [ ] - show proper UI with a button to redirect to create a new workspace
    // we may not want to show layout if user is not authorized in workspace level
    return (
      <div className="container h-screen flex justify-center items-center">
        <p className="text-2xl font-semibold">You are not authorized to access this workspace.</p>
      </div>
    );
  }

  // FIXME: show 404 for workspace not workspace member
  if (error?.status === 404) {
    return (
      <div className="container h-screen flex justify-center items-center">
        <p className="text-2xl font-semibold">No such workspace exist. Create one?</p>
      </div>
    );
  }

  // TODO: if user doesn't have access to workspace settings page show them them sidebar and header but not the main content
  return <>{children}</>;
};

export default WorkspaceAuthorizationLayout;
