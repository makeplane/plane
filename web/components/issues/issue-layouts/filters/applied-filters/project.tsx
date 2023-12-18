import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
// hooks
import { useProject } from "hooks/store";
// helpers
import { renderEmoji } from "helpers/emoji.helper";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedProjectFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { projectMap } = useProject();

  return (
    <>
      {values.map((projectId) => {
        const projectDetails = projectMap?.[projectId] ?? null;

        if (!projectDetails) return null;

        return (
          <div key={projectId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            {projectDetails.emoji ? (
              <span className="grid flex-shrink-0 place-items-center">{renderEmoji(projectDetails.emoji)}</span>
            ) : projectDetails.icon_prop ? (
              <div className="-my-1 grid flex-shrink-0 place-items-center">{renderEmoji(projectDetails.icon_prop)}</div>
            ) : (
              <span className="mr-1 grid flex-shrink-0 place-items-center rounded bg-gray-700 uppercase text-white">
                {projectDetails?.name.charAt(0)}
              </span>
            )}
            <span className="normal-case">{projectDetails.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(projectId)}
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
