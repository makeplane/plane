import { v4 as uuidv4 } from "uuid";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { IState } from "@plane/types";

type TMockCreateOrUpdateStateParams = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<IState>;
};

/**
 * Mock create or update state
 * @param workspaceSlug - The workspace slug
 * @param projectId - The project id
 * @param data - The state data
 * @returns The state
 */
export const mockCreateOrUpdateState = async (params: TMockCreateOrUpdateStateParams): Promise<IState> => {
  const { workspaceSlug, projectId, data } = params;
  // get the default state group
  const defaultStateGroup = STATE_GROUPS.backlog;
  // return the state
  return Promise.resolve({
    id: data.id ?? uuidv4(),
    name: data.name ?? defaultStateGroup.label,
    color: data.color ?? defaultStateGroup.color,
    default: data.default ?? false,
    description: data.description ?? "",
    group: data.group ?? defaultStateGroup.key,
    order: data.order ?? 0,
    project_id: projectId,
    workspace_id: workspaceSlug,
    sequence: data.sequence ?? Math.floor(Math.random() * 65535),
  });
};

export type TMockCreateDefaultProjectStatesParams = Omit<TMockCreateOrUpdateStateParams, "data">;

/**
 * Mock create default project states
 * @param params
 * @param params.workspaceSlug - The workspace slug
 * @param params.projectId - The project id
 * @returns The default project states
 */
export const mockCreateDefaultProjectStates = async (
  params: TMockCreateDefaultProjectStatesParams
): Promise<IState[]> => {
  const { workspaceSlug, projectId } = params;
  const states = [];
  for (const stateGroup of Object.values(STATE_GROUPS)) {
    const state = await mockCreateOrUpdateState({
      workspaceSlug,
      projectId,
      data: {
        name: stateGroup.defaultStateName,
        color: stateGroup.color,
        group: stateGroup.key,
        default: stateGroup.key === "backlog",
        project_id: projectId,
        workspace_id: workspaceSlug,
      },
    });
    states.push(state);
  }
  return Promise.resolve(states);
};
