// hooks
import useProjects from "hooks/use-projects";
// ui
import { CustomSelect } from "components/ui";
// icons
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";

export interface IssueProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const IssueProjectSelect: React.FC<IssueProjectSelectProps> = ({ value, onChange }) => {
  const { projects } = useProjects();

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
      onChange={(val: string) => onChange(val)}
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
