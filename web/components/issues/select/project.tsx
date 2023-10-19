import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { CustomSelect } from "@plane/ui";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
// icons
import { Clipboard } from "lucide-react";

export interface IssueProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const IssueProjectSelect: React.FC<IssueProjectSelectProps> = observer((props) => {
  const { value, onChange } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { project: projectStore } = useMobxStore();

  const projects = workspaceSlug ? projectStore.projects[workspaceSlug.toString()] : undefined;

  const selectedProject = projects?.find((i) => i.id === value);

  return (
    <CustomSelect
      value={value}
      label={
        selectedProject ? (
          <div className="flex items-center gap-1.5">
            <span className="grid place-items-center">
              {selectedProject.emoji
                ? renderEmoji(selectedProject.emoji)
                : selectedProject.icon_prop
                ? renderEmoji(selectedProject.icon_prop)
                : null}
            </span>
            <div className="truncate">{selectedProject.identifier}</div>
          </div>
        ) : (
          <>
            <Clipboard className="h-3 w-3" />
            <div>Select Project</div>
          </>
        )
      }
      onChange={(val: string) => onChange(val)}
      noChevron
    >
      {projects ? (
        projects.length > 0 ? (
          projects.map((project) => (
            <CustomSelect.Option key={project.id} value={project.id}>
              <div className="flex items-center gap-1.5">
                <span className="grid place-items-center">
                  {project.emoji
                    ? renderEmoji(project.emoji)
                    : project.icon_prop
                    ? renderEmoji(project.icon_prop)
                    : null}
                </span>
                <>{project.name}</>
              </div>
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
});
