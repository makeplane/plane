import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Loader } from "@plane/ui";
// services
import { WorkspaceService } from "@/services/workspace.service";

type TMemberProjectAssignment = {
  id: string;
  name: string;
  identifier: string;
  logo_props: Record<string, unknown>;
  is_member: boolean;
};

type Props = {
  workspaceSlug: string;
  memberId: string;
};

const workspaceService = new WorkspaceService();

export const MemberProjectAssignments = observer(function MemberProjectAssignments(props: Props) {
  const { workspaceSlug, memberId } = props;
  // state
  const [projects, setProjects] = useState<TMemberProjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workspaceService.fetchMemberProjects(workspaceSlug, memberId);
      setProjects(data);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to load project assignments.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [workspaceSlug, memberId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleToggleProject = async (projectId: string, currentlyAssigned: boolean) => {
    // Optimistic update
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, is_member: !currentlyAssigned } : p)));

    try {
      const updatedIds = projects
        .map((p) => {
          if (p.id === projectId) return !currentlyAssigned ? p.id : null;
          return p.is_member ? p.id : null;
        })
        .filter(Boolean) as string[];

      await workspaceService.updateMemberProjects(workspaceSlug, memberId, {
        project_ids: updatedIds,
      });
    } catch {
      // Revert on error
      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, is_member: currentlyAssigned } : p)));
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to update project assignment.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <Loader className="space-y-2">
          <Loader.Item height="20px" width="100%" />
          <Loader.Item height="20px" width="100%" />
        </Loader>
      </div>
    );
  }

  if (projects.length === 0) {
    return <div className="px-4 py-3 text-caption-sm-regular text-placeholder">No projects in this workspace.</div>;
  }

  return (
    <div className="px-4 py-3">
      <p className="mb-2 text-caption-sm-medium text-secondary">Project Assignments</p>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {projects.map((project) => (
          <label
            key={project.id}
            className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-caption-sm-regular transition-colors hover:bg-surface-2"
          >
            <input
              type="checkbox"
              checked={project.is_member}
              onChange={() => handleToggleProject(project.id, project.is_member)}
              className="accent-accent-primary h-3.5 w-3.5 rounded border-subtle"
            />
            <span className="truncate text-primary">{project.name}</span>
            <span className="ml-auto shrink-0 text-placeholder">{project.identifier}</span>
          </label>
        ))}
      </div>
    </div>
  );
});
