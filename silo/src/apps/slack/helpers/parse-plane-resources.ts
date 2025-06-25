import { PlaneResource } from "@plane/etl/slack";

export function extractPlaneResource(url: string): PlaneResource | null {
  try {
    const urlObj = new URL(url);

    // Split the pathname into segments
    const segments = urlObj.pathname.split("/").filter(Boolean);

    // Basic validation
    if (segments.length < 3) return null;

    // Check if it's an issue URL (must contain /browse/)
    if (segments.includes("browse")) {
      // Format: /plane/browse/WEB-3417/
      const [workspaceSlug, browse, issueKey] = segments;

      if (browse !== "browse" || !issueKey) return null;

      // Extract project identifier from issue key (e.g., "WEB" from "WEB-3417")
      const [projectIdentifier, issueIdentifer] = issueKey.split("-");

      if (!projectIdentifier) return null;

      return {
        workspaceSlug,
        projectIdentifier,
        type: "issue",
        issueKey: issueIdentifer,
      };
    }
    // Handle other resource types (cycles, modules)
    else {
      const [workspaceSlug, projectsSegment, projectId, _, resourceId] = segments;
      let resourceType = segments[3];

      if (projectsSegment !== "projects") return null;

      if ((resourceType === "issues" && !resourceId) || (!resourceType && !resourceId)) {
        resourceType = "project";
      }

      const baseResource = {
        workspaceSlug,
        projectId,
      };

      switch (resourceType) {
        case "project":
          return {
            type: "project",
            ...baseResource,
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
    }
  } catch (error) {
    return null;
  }
}
