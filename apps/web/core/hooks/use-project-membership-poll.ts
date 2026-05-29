import { useEffect, useRef, useCallback } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Polls the project list every 30 seconds and diffs against the current store.
 * If a project is removed from the user's access and they're currently viewing it,
 * redirects them to the workspace root.
 *
 * Mount this at the workspace layout level.
 */
export const useProjectMembershipPoll = () => {
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { fetchPartialProjects, joinedProjectIds, workspaceProjectIds } = useProject();
  const prevProjectIdsRef = useRef<Set<string>>(new Set());

  // Keep track of known project IDs
  useEffect(() => {
    const allIds = new Set([...(joinedProjectIds || []), ...(workspaceProjectIds || [])]);
    prevProjectIdsRef.current = allIds;
  }, [joinedProjectIds, workspaceProjectIds]);

  const pollProjects = useCallback(async () => {
    if (!workspaceSlug) return;

    try {
      const projects = await fetchPartialProjects(workspaceSlug.toString());
      const newProjectIds = new Set(projects.map((p) => p.id));
      const removedIds = [...prevProjectIdsRef.current].filter((id) => !newProjectIds.has(id));

      // Check if currently viewing a removed project
      if (removedIds.length > 0 && pathname) {
        const currentProjectMatch = pathname.match(/\/projects\/([^/]+)/);
        if (currentProjectMatch) {
          const currentProjectId = currentProjectMatch[1];
          if (removedIds.includes(currentProjectId)) {
            // Redirect to workspace root — project access was revoked
            router.push(`/${workspaceSlug}`);
          }
        }
      }

      prevProjectIdsRef.current = newProjectIds;
    } catch {
      // Silently fail — will retry on next interval
    }
  }, [workspaceSlug, fetchPartialProjects, pathname, router]);

  useEffect(() => {
    if (!workspaceSlug) return;

    const intervalId = setInterval(pollProjects, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [workspaceSlug, pollProjects]);
};
