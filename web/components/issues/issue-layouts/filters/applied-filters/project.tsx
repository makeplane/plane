import { observer } from "mobx-react-lite";

// icons
import { X } from "lucide-react";
// types
import { IProject } from "types";
import { renderEmoji } from "helpers/emoji.helper";

type Props = {
  handleRemove: (val: string) => void;
  projects: IProject[] | undefined;
  values: string[];
};

export const AppliedProjectFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, projects, values } = props;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {values.map((projectId) => {
        const projectDetails = projects?.find((p) => p.id === projectId);

        if (!projectDetails) return null;

        return (
          <div key={projectId} className="text-xs flex items-center gap-1 bg-custom-background-80 p-1 rounded">
            {projectDetails.emoji ? (
              <span className="grid flex-shrink-0 place-items-center">{renderEmoji(projectDetails.emoji)}</span>
            ) : projectDetails.icon_prop ? (
              <div className="grid place-items-center flex-shrink-0 -my-1">{renderEmoji(projectDetails.icon_prop)}</div>
            ) : (
              <span className="grid mr-1 flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                {projectDetails?.name.charAt(0)}
              </span>
            )}
            <span className="normal-case">{projectDetails.name}</span>
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(projectId)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </div>
  );
});
