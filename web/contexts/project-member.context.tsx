import { createContext, useContext } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// services
import { ProjectService } from "services/project";
// keys
import { USER_PROJECT_VIEW } from "constants/fetch-keys";
// types
import { IProjectMember } from "types";

type ContextType = {
  loading: boolean;
  memberDetails?: IProjectMember;
  error: any;
};

// services
const projectService = new ProjectService();

export const ProjectMemberContext = createContext<ContextType>({} as ContextType);

type Props = {
  children: React.ReactNode;
};

export const ProjectMemberProvider: React.FC<Props> = (props) => {
  const { children } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: memberDetails, error } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const loading = !memberDetails && !error;

  return (
    <ProjectMemberContext.Provider value={{ loading, memberDetails, error }}>{children}</ProjectMemberContext.Provider>
  );
};

export const useProjectMyMembership = () => {
  const context = useContext(ProjectMemberContext);

  if (context === undefined) throw new Error(`useProjectMember must be used within a ProjectMemberProvider.`);

  return {
    ...context,
    memberRole: {
      isOwner: context.memberDetails?.role === 20,
      isMember: context.memberDetails?.role === 15,
      isViewer: context.memberDetails?.role === 10,
      isGuest: context.memberDetails?.role === 5,
    },
  };
};
