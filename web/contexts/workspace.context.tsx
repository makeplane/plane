import { FC, ReactElement, createContext } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { WorkspaceService } from "services/workspace.service";
// types
import { IWorkspace } from "types";
// constants
import { USER_WORKSPACES } from "constants/fetch-keys";

export interface WorkspaceProviderProps {
  children: ReactElement;
}

export interface WorkspaceContextProps {
  workspaces: IWorkspace[];
  activeWorkspace: IWorkspace | undefined;
  mutateWorkspaces: () => void;
}

// services
const workspaceService = new WorkspaceService();

export const WorkspaceContext = createContext<WorkspaceContextProps>({} as WorkspaceContextProps);

export const WorkspaceProvider: FC<WorkspaceProviderProps> = (props) => {
  const { children } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // API to fetch user information
  const { data = [], error, mutate } = useSWR<IWorkspace[]>(USER_WORKSPACES, () => workspaceService.userWorkspaces());
  // active workspace
  const activeWorkspace = data?.find((w) => w.slug === workspaceSlug);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces: error ? [] : data,
        activeWorkspace,
        mutateWorkspaces: mutate,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};
