import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon } from "@plane/propel/icons";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedProjectFilters = observer(function AppliedProjectFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  // store hooks
  const { projectMap } = useProject();

  return (
    <>
      {values.map((projectId) => {
        const projectDetails = projectMap?.[projectId] ?? null;

        if (!projectDetails) return null;

        return (
          <div key={projectId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <span className="grid place-items-center flex-shrink-0 h-4 w-4">
              <Logo logo={projectDetails.logo_props} size={12} />
            </span>
            <span className="normal-case">{projectDetails.name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(projectId)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
