import { ExState, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { logger } from "@/logger";

/* ----------------------------- State Creation Utilities ----------------------------- */
export const createStates = async (
  jobId: string,
  states: { target_state: Partial<ExState>; source_state: any }[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string,
  existingStates: ExState[]
): Promise<{ source_state: any; target_state: Partial<ExState> }[]> => {
  const createState = async (state: { source_state: any; target_state: Partial<ExState> }) => {
    try {
      // check if the state already exists (by external_id or by name) BEFORE calling the API
      const existingStateById = existingStates.find(
        (exState) => exState.external_id === state.target_state.external_id
      );
      const existingStateByName = existingStates.find(
        (exState) => exState.name?.trim().toLowerCase() === state.target_state.name?.trim().toLowerCase()
      );
      if (existingStateById || existingStateByName) {
        return {
          source_state: state.source_state,
          target_state: (existingStateById || existingStateByName) as ExState,
        };
      }

      // create if not found
      const newState: ExState = await protect(
        planeClient.state.create.bind(planeClient.state),
        workspaceSlug,
        projectId,
        state.target_state
      );

      // add the new state to the existing states
      existingStates.push(newState);

      return {
        source_state: state.source_state,
        target_state: newState,
      };
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the state: ${state.target_state.name}`);
      return undefined;
    }
  };
  // batch the state creation
  const createdStates = await processBatchPromises(states, createState, 2);

  return createdStates?.filter((state) => state !== undefined) ?? [];
};
