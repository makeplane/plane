import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useProject, useWorkspace } from "@/hooks/store";
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";
import { TProject } from "@/plane-web/types/projects";
import { StateDropdown } from "../../../dropdowns";

type Props = {
  project: TProject;
  onClose?: () => void;
  onChange: (project: TProject, data: Partial<TProject>) => void;
  disabled: boolean;
};

export const SpreadsheetStateColumn: React.FC<Props> = observer((props) => {
  const { project, onChange, disabled } = props;
  const { workspaceSlug } = useParams();
  const { currentWorkspace } = useWorkspace();
  const { getProjectById } = useProject();
  const { defaultState } = useWorkspaceProjectStates();

  // derived values
  const projectDetails = getProjectById(project.id);
  const selectedId = projectDetails?.state_id || defaultState;
  return (
    <div className="h-11 border-b-[0.5px] border-custom-border-200">
      {currentWorkspace?.id && (
        <StateDropdown
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={currentWorkspace.id}
          onChange={(data) => onChange(project, { state_id: data })}
          className="h-full "
          buttonClassName="h-full m-auto border-none px-4 rounded-none"
          value={selectedId!}
          disabled={disabled}
        />
      )}
    </div>
  );
});
