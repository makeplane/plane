import { observer } from "mobx-react-lite";
// hooks
import { useProject } from "hooks/store";
// icons
import { Contrast, LayoutGrid, Users } from "lucide-react";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { truncateText } from "helpers/string.helper";

type Props = {
  projectIds: string[];
};

export const CustomAnalyticsSidebarProjectsList: React.FC<Props> = observer((props) => {
  const { projectIds } = props;

  const { getProjectById } = useProject();

  return (
    <div className="hidden h-full overflow-hidden md:flex md:flex-col">
      <h4 className="font-medium">Selected Projects</h4>
      <div className="mt-4 h-full space-y-6 overflow-y-auto">
        {projectIds.map((projectId) => {
          const project = getProjectById(projectId);

          if (!project) return;

          return (
            <div key={projectId} className="w-full">
              <div className="flex items-center gap-1 text-sm">
                {project.emoji ? (
                  <span className="grid h-6 w-6 flex-shrink-0 place-items-center">{renderEmoji(project.emoji)}</span>
                ) : project.icon_prop ? (
                  <div className="grid h-6 w-6 flex-shrink-0 place-items-center">{renderEmoji(project.icon_prop)}</div>
                ) : (
                  <span className="mr-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                    {project?.name.charAt(0)}
                  </span>
                )}
                <h5 className="flex items-center gap-1">
                  <p className="break-words">{truncateText(project.name, 20)}</p>
                  <span className="ml-1 text-xs text-custom-text-200">({project.identifier})</span>
                </h5>
              </div>
              <div className="mt-4 w-full space-y-3 pl-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Users className="text-custom-text-200" size={14} strokeWidth={2} />
                    <h6>Total members</h6>
                  </div>
                  <span className="text-custom-text-200">{project.total_members}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Contrast className="text-custom-text-200" size={14} strokeWidth={2} />
                    <h6>Total cycles</h6>
                  </div>
                  <span className="text-custom-text-200">{project.total_cycles}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="text-custom-text-200" size={14} strokeWidth={2} />
                    <h6>Total modules</h6>
                  </div>
                  <span className="text-custom-text-200">{project.total_modules}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
