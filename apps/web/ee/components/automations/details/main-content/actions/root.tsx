import { observer } from "mobx-react";
import { Workflow } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  EActionNodeHandlerName,
  EAutomationSidebarTab,
  TAddCommentActionConfig,
  TChangePropertyActionConfig,
} from "@plane/types";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsMainContentAddNodeButton } from "../common/add-node-button";
import { AutomationDetailsMainContentBlockWrapper } from "../common/block-wrapper";
import { ConjunctionLabel } from "../common/conjunction-label";
import { AutomationDetailsMainContentSectionWrapper } from "../common/section-wrapper";
import { AutomationDetailsMainContentChangePropertyBlock } from "./change-property";
import { AutomationDetailsMainContentAddCommentBlock } from "./comment-block";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentActionsRoot: React.FC<TProps> = observer((props) => {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const workspaceId = automation?.workspace;
  const workspaceSlug = automation?.workspaceSlug;
  const actionNodes = automation?.allActions;
  const sidebarHelper = automation?.sidebarHelper;
  const isCreateActionNodeSelected =
    sidebarHelper?.selectedSidebarConfig.tab === EAutomationSidebarTab.ACTION &&
    sidebarHelper?.selectedSidebarConfig.mode === "create";
  const isEditActionNodeSelected =
    sidebarHelper?.selectedSidebarConfig.tab === EAutomationSidebarTab.ACTION &&
    sidebarHelper?.selectedSidebarConfig.mode === "view";

  if (!automation || !workspaceId || !workspaceSlug) return null;
  return (
    <AutomationDetailsMainContentSectionWrapper title={t("automations.action.label")} icon={Workflow}>
      <div className="flex flex-grow flex-col space-y-6">
        {automation?.isAnyActionNodeAvailable && (
          <AutomationDetailsMainContentBlockWrapper
            isSelected={isEditActionNodeSelected}
            onClick={() => sidebarHelper?.setSelectedSidebarConfig({ tab: EAutomationSidebarTab.ACTION, mode: "view" })}
          >
            {actionNodes?.map((actionNode, index) => (
              <div key={actionNode.id} className="flex flex-col gap-2">
                <ConjunctionLabel
                  text={index === 0 ? t("automations.conjunctions.then") : t("automations.conjunctions.and")}
                />
                {actionNode.handler_name === EActionNodeHandlerName.ADD_COMMENT && (
                  <AutomationDetailsMainContentAddCommentBlock
                    actionId={actionNode.id}
                    config={actionNode.config as TAddCommentActionConfig} // TODO: Check if we can avoid this type assertion
                    workspaceId={workspaceId}
                    workspaceSlug={workspaceSlug}
                  />
                )}
                {actionNode.handler_name === EActionNodeHandlerName.CHANGE_PROPERTY && (
                  <AutomationDetailsMainContentChangePropertyBlock
                    config={actionNode.config as TChangePropertyActionConfig} // TODO: Check if we can avoid this type assertion
                    projectId={automation.project}
                  />
                )}
              </div>
            ))}
          </AutomationDetailsMainContentBlockWrapper>
        )}
        <AutomationDetailsMainContentAddNodeButton
          label={t("automations.action.add_action")}
          isSelected={isCreateActionNodeSelected}
          onClick={() => sidebarHelper?.setSelectedSidebarConfig({ tab: EAutomationSidebarTab.ACTION, mode: "create" })}
        />
      </div>
    </AutomationDetailsMainContentSectionWrapper>
  );
});
