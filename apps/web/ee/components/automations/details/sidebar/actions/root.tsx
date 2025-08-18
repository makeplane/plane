import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  EActionNodeHandlerName,
  EAutomationNodeType,
  TAutomationActionNodeConfig,
  TChangePropertyActionConfig,
  TChangePropertyActionFormConfig,
} from "@plane/types";
import { Button } from "@plane/ui";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import { IAutomationActionNodeInstance } from "@/plane-web/store/automations/node/action";
// local imports
import { DeleteAutomationNodeConfirmationModal } from "../delete-confirmation-modal";
import {
  AutomationDetailsSidebarActionsFormRoot,
  EAutomationActionFormType,
  EAutomationExistingActionMode,
  TAutomationActionFormData,
} from "./form/root";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarActionRoot: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // refs
  const actionFormRef = useRef<HTMLFormElement>(null);
  // states
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [existingActionModeMap, setExistingActionModeMap] = useState<Map<string, EAutomationExistingActionMode>>(
    new Map()
  );
  const [selectedActionToDelete, setSelectedActionToDelete] = useState<string | null>(null);
  const [isCreatingUpdatingAction, setIsCreatingUpdatingAction] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const projectId = automation?.project;
  const workspaceId = automation?.workspace;
  const workspaceSlug = automation?.workspaceSlug;
  const actionNodes = automation?.allActions;
  const actionNodesCount = actionNodes?.length ?? 0;
  const sidebarHelper = automation?.sidebarHelper;
  const isCreateActionButtonSelected = sidebarHelper?.selectedSidebarConfig.mode === "create";

  const scrollToActionForm = useCallback((formElement: HTMLFormElement | null) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        formElement?.scrollIntoView({
          behavior: "smooth",
        });
      });
    }, 100);
  }, []);

  const openActionForm = useCallback(
    (formElement: HTMLFormElement | null) => {
      setIsActionFormOpen(true);
      scrollToActionForm(formElement);
    },
    [scrollToActionForm]
  );

  useEffect(() => {
    if (isCreateActionButtonSelected) {
      setIsActionFormOpen(true);
      requestAnimationFrame(() => {
        actionFormRef.current?.scrollIntoView({
          behavior: "smooth",
        });
      });
    }
  }, [isCreateActionButtonSelected]);

  const getExistingActionMode = (actionNodeId: string) =>
    existingActionModeMap.get(actionNodeId) ?? EAutomationExistingActionMode.VIEW;

  const setExistingActionMode = (actionNodeId: string, mode: EAutomationExistingActionMode) => {
    setExistingActionModeMap((prev) => new Map(prev).set(actionNodeId, mode));
  };

  const validateAndTransformFormData = (data: TAutomationActionFormData): TAutomationActionNodeConfig | null => {
    if (!data.handler_name || !data.config) return null;

    if (data.handler_name === EActionNodeHandlerName.CHANGE_PROPERTY) {
      const formConfig = data.config as TChangePropertyActionFormConfig;
      if (!formConfig.property_name || !formConfig.change_type || !formConfig.property_value?.length) {
        return null; // Validation failed
      }
      return {
        property_name: formConfig.property_name,
        change_type: formConfig.change_type,
        property_value: formConfig.property_value,
      } as TChangePropertyActionConfig;
    }

    return data.config as TAutomationActionNodeConfig;
  };

  const handleCreateAction = async (data: TAutomationActionFormData) => {
    const validConfig = validateAndTransformFormData(data);
    if (!validConfig || !data.handler_name) return; // TODO: Add toast error

    setIsCreatingUpdatingAction(true);
    await automation?.createAction({
      handler_name: data.handler_name,
      config: validConfig,
    });
    setIsActionFormOpen(false);
    setIsCreatingUpdatingAction(false);
  };

  const handleUpdateAction = async (actionNode: IAutomationActionNodeInstance, data: TAutomationActionFormData) => {
    const validConfig = validateAndTransformFormData(data);
    if (!validConfig || !data.handler_name) return; // TODO: Add toast error

    setIsCreatingUpdatingAction(true);
    await actionNode.update({
      handler_name: data.handler_name,
      config: validConfig,
    });
    setExistingActionMode(actionNode.id, EAutomationExistingActionMode.VIEW);
    setIsCreatingUpdatingAction(false);
  };

  const handleDeleteAction = async () => {
    if (!selectedActionToDelete) return;
    await automation?.deleteAction(selectedActionToDelete);
    setSelectedActionToDelete(null);
  };

  if (!projectId || !workspaceId || !workspaceSlug) return null;
  return (
    <>
      <DeleteAutomationNodeConfirmationModal
        nodeType={EAutomationNodeType.ACTION}
        handleClose={() => setSelectedActionToDelete(null)}
        handleDelete={() => handleDeleteAction()}
        isOpen={!!selectedActionToDelete}
      />
      <section className="flex-grow space-y-4">
        {actionNodes?.map((actionNode, index) => (
          <AutomationDetailsSidebarActionsFormRoot
            key={actionNode.id}
            automationId={automationId}
            currentIndex={index}
            isSubmitting={isCreatingUpdatingAction}
            onCancel={() => setExistingActionMode(actionNode.id, EAutomationExistingActionMode.VIEW)}
            onDelete={() => setSelectedActionToDelete(actionNode.id)}
            onSubmit={(data) => handleUpdateAction(actionNode, data)}
            projectId={projectId}
            workspaceId={workspaceId}
            workspaceSlug={workspaceSlug}
            type={EAutomationActionFormType.EXISTING}
            data={actionNode.asJSON}
            mode={getExistingActionMode(actionNode.id)}
            updateMode={(mode) => setExistingActionMode(actionNode.id, mode)}
            isOnlyActionNode={actionNodesCount === 1}
            isAutomationEnabled={automation?.is_enabled}
          />
        ))}
        {isActionFormOpen ? (
          <AutomationDetailsSidebarActionsFormRoot
            ref={actionFormRef}
            automationId={automationId}
            currentIndex={actionNodesCount}
            isSubmitting={isCreatingUpdatingAction}
            onCancel={() => setIsActionFormOpen(false)}
            onDelete={() => setIsActionFormOpen(false)}
            onSubmit={handleCreateAction}
            projectId={projectId}
            workspaceId={automation?.workspace}
            workspaceSlug={automation?.workspaceSlug}
            type={EAutomationActionFormType.NEW}
          />
        ) : (
          <section className="flex-grow px-6">
            <Button
              size="sm"
              variant="neutral-primary"
              onClick={() => {
                openActionForm(actionFormRef.current);
              }}
              loading={isCreatingUpdatingAction}
              disabled={isCreatingUpdatingAction}
            >
              {t("automations.action.add_action")}
            </Button>
          </section>
        )}
      </section>
    </>
  );
});
