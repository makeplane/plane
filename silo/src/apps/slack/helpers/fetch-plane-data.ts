import { ExIssueLabel, ExState, Client as PlaneClient, PlaneUser } from "@plane/sdk";

export type PlaneProjectAssets = {
  states: ExState[];
  members: PlaneUser[];
  labels: ExIssueLabel[];
};

export const fetchPlaneAssets = async (slug: string, projectId: string, planeClient: PlaneClient) => {
  const states = await planeClient.state.list(slug, projectId);
  return { states };
};
