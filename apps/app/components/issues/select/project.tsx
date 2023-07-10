import { useRouter } from "next/router";

import useSWR from "swr";

// ui
import { CustomSelect } from "components/ui";
// icons
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
// services
import projectService from "services/project.service";
// fetch-keys
import { PROJECTS_LIST } from "constants/fetch-keys";

export interface IssueProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
  setActiveProject: React.Dispatch<React.SetStateAction<string | null>>;
}

export const IssueProjectSelect: React.FC<IssueProjectSelectProps> = ({
  value,
  onChange,
  setActiveProject,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // Fetching Projects List
  const { data: projects } = useSWR(
    workspaceSlug ? PROJECTS_LIST(workspaceSlug as string) : null,
    () => (workspaceSlug ? projectService.getProjects(workspaceSlug as string) : null)
  );

  return (
    <CustomSelect
      value={value}
      label={
        <>
          <ClipboardDocumentListIcon className="h-3 w-3" />
          <span className="block truncate">
            {projects?.find((i) => i.id === value)?.identifier ?? "Project"}
          </span>
        </>
      }
      onChange={(val: string) => {
        onChange(val);
        setActiveProject(val);
      }}
      noChevron
    >
      {projects ? (
        projects.length > 0 ? (
          projects.map((project) => (
            <CustomSelect.Option key={project.id} value={project.id}>
              <>{project.name}</>
            </CustomSelect.Option>
          ))
        ) : (
          <p className="text-gray-400">No projects found!</p>
        )
      ) : (
        <div className="px-2 text-sm text-custom-text-200">Loading...</div>
      )}
    </CustomSelect>
  );
};
