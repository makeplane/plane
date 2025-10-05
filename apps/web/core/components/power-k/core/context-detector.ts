import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import type { TPowerKContextEntity } from "./types";

/**
 * Detects the current context from the URL params and pathname
 * Returns information about the active entity (work item, project, cycle, etc.)
 */
export function detectContextFromURL(params: Params, _pathname: string): TPowerKContextEntity | null {
  if (params.workItem) {
    const workItemIdentifier = params.workItem;
    return {
      type: "work-item",
      id: workItemIdentifier,
      identifier: workItemIdentifier,
      title: workItemIdentifier,
    };
  }

  if (params.cycleId) {
    const cycleId = params.cycleId;
    return {
      type: "cycle",
      id: cycleId,
      title: "Cycle",
    };
  }

  if (params.moduleId) {
    const moduleId = params.moduleId;
    return {
      type: "module",
      id: moduleId,
      title: "Module",
    };
  }

  if (params.projectId) {
    const projectId = params.projectId;
    return {
      type: "project",
      id: projectId,
      title: "Project",
    };
  }

  return null;
}

/**
 * Updates context entity with actual data from stores
 */
export function enrichTPowerKContextEntity(
  context: TPowerKContextEntity | null,
  getIssueById?: (id: string) => any,
  getProjectById?: (id: string) => any,
  getCycleById?: (projectId: string, cycleId: string) => any
): TPowerKContextEntity | null {
  if (!context) return null;

  try {
    switch (context.type) {
      case "work-item":
        if (getIssueById) {
          const issue = getIssueById(context.id);
          if (issue) {
            return {
              ...context,
              title: issue.name || context.identifier || context.id,
            };
          }
        }
        break;

      case "project":
        if (getProjectById) {
          const project = getProjectById(context.id);
          if (project) {
            return {
              ...context,
              title: project.name || context.id,
            };
          }
        }
        break;

      case "cycle":
        // Cycle enrichment would need projectId - skip for now
        break;
    }
  } catch (error) {
    // Ignore errors in enrichment
    console.warn("Failed to enrich context entity:", error);
  }

  return context;
}
