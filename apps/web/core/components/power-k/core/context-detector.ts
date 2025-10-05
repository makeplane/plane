import type { Params } from "next/dist/shared/lib/router/utils/route-matcher";
// local imports
import type { TPowerKContextType } from "./types";

/**
 * Detects the current context from the URL params and pathname
 * Returns information about the active entity (work item, project, cycle, etc.)
 */
export const detectContextFromURL = (params: Params): TPowerKContextType | null => {
  if (params.workItem) return "work-item";
  if (params.cycleId) return "cycle";
  if (params.moduleId) return "module";
  if (params.pageId) return "page";

  return null;
};
