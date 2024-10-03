// helpers
import { getFileURL } from "@/helpers/file.helper";

/**
 * @description generate the file source using assetId
 * @param {string} workspaceSlug
 * @param {string} projectId
 * @param {string} assetId
 */
export const getEditorAssetSrc = (workspaceSlug: string, projectId: string, assetId: string): string | undefined =>
  getFileURL(`/api/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/`);
