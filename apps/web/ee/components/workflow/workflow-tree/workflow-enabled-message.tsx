import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { DoubleCircleIcon } from "@plane/ui";
import { useProjectState } from "@/hooks/store";
// local imports
import { WorkflowTree } from "./workflow-tree";

type Props = {
  parentStateId: string;
};

export const WorkFlowEnabledMessage = observer((props: Props) => {
  const { parentStateId } = props;
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  // derived state
  const parentState = getStateById(parentStateId);

  if (!parentState) return <></>;

  return (
    <div className="relative w-72 flex flex-col gap-2">
      <div className="flex gap-1 items-center">
        <DoubleCircleIcon className="size-3 text-custom-text-200" />
        <span className="text-xs font-medium">{t("workflows.workflow_enabled.label")}</span>
      </div>
      <div className="pl-4">
        <WorkflowTree parentStateId={parentStateId} />
      </div>
    </div>
  );
});
