import useUser from "hooks/use-user";

// hooks
import { useProjectMyMembership, ProjectMemberProvider } from "contexts/project-member.context";

type Props = {
  children: React.ReactNode;
};

const ProjectAuthorizationWrapper: React.FC<Props> = (props) => (
  <ProjectMemberProvider>
    <ProjectAuthorizationWrapped>{props.children}</ProjectAuthorizationWrapped>
  </ProjectMemberProvider>
);

const ProjectAuthorizationWrapped: React.FC<Props> = (props) => {
  const { children } = props;

  const user = useUser();

  const { memberDetails, loading, error } = useProjectMyMembership();

  const isOwner = memberDetails?.role === 20;
  const isMember = memberDetails?.role === 15;
  const isViewer = memberDetails?.role === 10;
  const isGuest = memberDetails?.role === 5;

  if (loading)
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
        <p className="text-2xl font-semibold">You are not authorized to access this project.</p>
      </div>
    );
  }

  // FIXME: show 404 for workspace not workspace member
  if (error?.status === 404) {
    return (
      <div className="container h-screen flex justify-center items-center">
        <p className="text-2xl font-semibold">No such project exist. Create one?</p>
      </div>
    );
  }

  // TODO: if user doesn't have access to workspace settings page show them them sidebar and header but not the main content
  return <>{children}</>;
};

export default ProjectAuthorizationWrapper;
