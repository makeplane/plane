// icons
import { Contrast, LayoutGrid, Users } from "lucide-react";
// helpers
import { renderEmoji } from "helpers/emoji.helper";
import { truncateText } from "helpers/string.helper";
// types
import { IProject } from "types";

type Props = {
  projects: IProject[];
};

export const CustomAnalyticsSidebarProjectsList: React.FC<Props> = (props) => {
  const { projects } = props;

  return (
    <div className="hidden h-full overflow-hidden md:flex md:flex-col">
      <h4 className="font-medium">Selected Projects</h4>
      <div className="space-y-6 mt-4 h-full overflow-y-auto">
        {projects.map((project) => (
          <div key={project.id} className="w-full">
            <div className="text-sm flex items-center gap-1">
              {project.emoji ? (
                <span className="grid h-6 w-6 flex-shrink-0 place-items-center">{renderEmoji(project.emoji)}</span>
              ) : project.icon_prop ? (
                <div className="h-6 w-6 grid place-items-center flex-shrink-0">{renderEmoji(project.icon_prop)}</div>
              ) : (
                <span className="grid h-6 w-6 mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                  {project?.name.charAt(0)}
                </span>
              )}
              <h5 className="flex items-center gap-1">
                <p className="break-words">{truncateText(project.name, 20)}</p>
                <span className="text-custom-text-200 text-xs ml-1">({project.identifier})</span>
              </h5>
            </div>
            <div className="mt-4 space-y-3 pl-2 w-full">
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
        ))}
      </div>
    </div>
  );
};
