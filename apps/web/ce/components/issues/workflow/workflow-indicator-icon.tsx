import { observer } from "mobx-react";
import { GitMerge } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local
import { WorkflowStateInfoPopup } from "./workflow-state-info-popup";

type Props = {
  projectId: string;
  stateId: string;
};

/**
 * Shown on Kanban column headers when workflow is live.
 * The icon lives on the TARGET state column; the popup explains
 * which source states can transition into this one and who can do it.
 */
export const WorkflowIndicatorIcon = observer(function WorkflowIndicatorIcon({ projectId, stateId }: Props) {
  const { t } = useTranslation();

  return (
    <WorkflowStateInfoPopup projectId={projectId} targetStateId={stateId}>
      <button
        type="button"
        className="flex items-center justify-center rounded p-0.5 text-teal-500 hover:bg-teal-500/10 transition-colors"
        aria-label={t("project_settings.workflows.indicator_popup_title")}
      >
        <GitMerge className="h-3.5 w-3.5" />
      </button>
    </WorkflowStateInfoPopup>
  );
});
