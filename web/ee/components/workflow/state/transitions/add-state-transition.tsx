import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, setToast, Spinner, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { StateDropdown } from "@/components/dropdowns";
// hooks
import { useProjectState } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentStateId: string;
  onTransitionAdd?: () => void;
};

export const AddStateTransition = observer((props: Props) => {
  const { workspaceSlug, projectId, parentStateId, onTransitionAdd } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isAdding, setIsAdding] = useState(false);
  // store hooks
  const { addStateTransition, getAvailableStateTransitionIds } = useProjectState();
  // derived state
  const availableStateTransitionIds = getAvailableStateTransitionIds(projectId, parentStateId, undefined);
  // handlers
  const addNewTransition = async (transitionStateId: string) => {
    setIsAdding(true);
    try {
      addStateTransition(workspaceSlug, projectId, parentStateId, transitionStateId);
      if (onTransitionAdd) {
        onTransitionAdd();
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflows.toasts.add_state_change_rule.error.title"),
        message: t("workflows.toasts.add_state_change_rule.error.message"),
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={cn("flex px-3 h-10 items-center justify-start gap-2")}>
      <StateDropdown
        button={
          <Button
            variant="accent-primary"
            size="sm"
            className={cn("text-xs px-2 py-1", {
              "cursor-pointer": !isAdding,
            })}
          >
            {isAdding ? (
              <div className="flex gap-1 items-center">
                <Spinner height="15px" width="15px" />
                <span>{t("workflows.workflow_states.state_changes.label.loading")}</span>{" "}
              </div>
            ) : (
              t("workflows.workflow_states.state_changes.label.default")
            )}
          </Button>
        }
        buttonVariant={"transparent-with-text"}
        projectId={projectId}
        onChange={addNewTransition}
        value={undefined}
        showDefaultState={false}
        renderByDefault={false}
        stateIds={availableStateTransitionIds}
        filterAvailableStateIds={false}
      />
    </div>
  );
});
