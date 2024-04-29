import { observer } from "mobx-react";
import { X } from "lucide-react";
// hooks
import { ProjectLogo } from "@/components/project";
import { useProject } from "@/hooks/store";
// components

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
            <span className="grid place-items-center flex-shrink-0 h-4 w-4">
              <ProjectLogo logo={projectDetails.logo_props} className="text-sm" />
            </span>
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
