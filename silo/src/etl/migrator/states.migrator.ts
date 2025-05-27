import { ExState, Client as PlaneClient } from "@plane/sdk";
import { protect } from "@/lib";
import { logger } from "@/logger";

/* ----------------------------- State Creation Utilities ----------------------------- */
export const createStates = async (
  jobId: string,
  states: { target_state: ExState; source_state: any }[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
) => {
  const createdStates: { source_state: any; target_state: ExState }[] = [];

  const statePromises = states.map(async (state) => {
    try {
      const strippedPlaneState = {
        name: state.target_state.name,
        group: state.target_state.group,
        color: state.target_state.color,
      };
      const createdState: any = await protect(
        planeClient.state.create.bind(planeClient.state),
        workspaceSlug,
        projectId,
        strippedPlaneState
      );

      if (createdState) {
        createdStates.push({
          source_state: state.source_state,
          target_state: createdState,
        });
      }
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the state: ${state.target_state.name}`, error);
    }
  });

  await Promise.all(statePromises);
  return createdStates;
};
