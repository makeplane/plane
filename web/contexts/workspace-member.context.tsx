import { createContext, useContext } from "react";

// next
import { useRouter } from "next/router";

import useSWR from "swr";
// services
import { WorkspaceService } from "services/workspace.service";
// types
import { IWorkspaceMember } from "types";
// fetch-keys
import { WORKSPACE_MEMBERS_ME } from "constants/fetch-keys";

type ContextType = {
  loading: boolean;
  memberDetails?: IWorkspaceMember;
  error: any;
};

export const WorkspaceMemberContext = createContext<ContextType>({} as ContextType);

type Props = {
  children: React.ReactNode;
};

// services
const workspaceService = new WorkspaceService();

export const WorkspaceMemberProvider: React.FC<Props> = (props) => {
  const { children } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: memberDetails, error } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_ME(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.workspaceMemberMe(workspaceSlug.toString()) : null
  );

  const loading = !memberDetails && !error;

  return (
    <WorkspaceMemberContext.Provider value={{ loading, memberDetails, error }}>
      {children}
    </WorkspaceMemberContext.Provider>
  );
};

export const useWorkspaceMyMembership = () => {
  const context = useContext(WorkspaceMemberContext);

  if (context === undefined) throw new Error(`useWorkspaceMember must be used within a WorkspaceMemberProvider.`);

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
