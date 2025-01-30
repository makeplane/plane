import { PlaneResource } from "@plane/etl/slack";

export function extractPlaneResource(url: string): PlaneResource | null {
  try {
    const urlObj = new URL(url);

    // Split the pathname into segments
    const segments = urlObj.pathname.split("/").filter(Boolean);

    // Basic validation
    if (segments.length < 4) return null;

    const [workspaceSlug, projectsSegment, projectId, resourceType, resourceId] = segments;

    if (projectsSegment !== "projects") return null;

    const baseResource = {
      workspaceSlug,
      projectId,
    };

    switch (resourceType) {
      case "issues":
        return resourceId
          ? {
              ...baseResource,
              type: "issue",
              issueId: resourceId,
            }
          : {
              ...baseResource,
              type: "project",
            };

      case "cycles":
        if (!resourceId) return null;
        return {
          ...baseResource,
          type: "cycle",
          cycleId: resourceId,
        };

      case "modules":
        if (!resourceId) return null;
        return {
          ...baseResource,
          type: "module",
          moduleId: resourceId,
        };

      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}
