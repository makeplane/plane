import { observer } from "mobx-react";
import { X } from "lucide-react";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { ProjectStateIcon } from "@/plane-web/components/workspace-project-states";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { TProjectState } from "@/plane-web/types/workspace-project-states";

type Props = {
  handleRemove: (val: string) => void;
  appliedFilters: string[];
  editable: boolean | undefined;
};

export const AppliedStateFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, appliedFilters, editable } = props;

  const { getProjectStatesByWorkspaceId } = useWorkspaceProjectStates();

  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || undefined;
  const states = getProjectStatesByWorkspaceId(workspaceId ?? "") ?? ([] as TProjectState[]);

  return (
    <>
      {appliedFilters.map((state) => {
        const stateDetails = states.find((s) => s.id === state);
        if (!stateDetails) return null;
        return (
          <div key={state} className="flex items-center gap-1 rounded px-1.5 py-1 text-xs bg-custom-background-80">
            <ProjectStateIcon projectStateGroup={stateDetails.group} width="14" height="14" />
            {stateDetails?.name}
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(state)}
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
