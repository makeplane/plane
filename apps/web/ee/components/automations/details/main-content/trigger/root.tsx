import { useMemo } from "react";
import { observer } from "mobx-react";
import { Zap } from "lucide-react";
// plane imports
import { AUTOMATION_TRIGGER_SELECT_OPTIONS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EAutomationSidebarTab } from "@plane/types";
// plane web imports
import { AutomationTriggerIcon } from "@/plane-web/components/automations/details/sidebar/trigger/icon";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsMainContentAddNodeButton } from "../common/add-node-button";
import { AutomationDetailsMainContentBlockWrapper } from "../common/block-wrapper";
import { ConjunctionLabel } from "../common/conjunction-label";
import { AutomationDetailsMainContentSectionWrapper } from "../common/section-wrapper";
import { AutomationDetailsMainContentTriggerCondition } from "./condition/root";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentTriggerRoot: React.FC<TProps> = observer((props) => {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const isViewTriggerNodeSelected =
    sidebarHelper?.selectedSidebarConfig.tab === EAutomationSidebarTab.TRIGGER &&
    sidebarHelper?.selectedSidebarConfig.mode === "view";
  const isCreateTriggerNodeSelected =
    sidebarHelper?.selectedSidebarConfig.tab === EAutomationSidebarTab.TRIGGER &&
    sidebarHelper?.selectedSidebarConfig.mode === "create";
  const triggerNode = automation?.trigger;
  const selectedTriggerNodeHandlerOption = useMemo(
    () => AUTOMATION_TRIGGER_SELECT_OPTIONS.find((option) => option.value === triggerNode?.handler_name),
    [triggerNode?.handler_name]
  );

  return (
    <AutomationDetailsMainContentSectionWrapper title={t("automations.trigger.label")} icon={Zap} iconVariant="filled">
      {selectedTriggerNodeHandlerOption ? (
        <>
          <AutomationDetailsMainContentBlockWrapper
            isSelected={isViewTriggerNodeSelected}
            onClick={() =>
              sidebarHelper?.setSelectedSidebarConfig({ tab: EAutomationSidebarTab.TRIGGER, mode: "view" })
            }
          >
            <>
              <ConjunctionLabel text={t("automations.conjunctions.if")} />
              <span className="flex items-center gap-1.5 text-sm font-medium text-custom-text-200">
                <AutomationTriggerIcon iconKey={selectedTriggerNodeHandlerOption.iconKey} />
                {selectedTriggerNodeHandlerOption.readableLabel}
              </span>
            </>
            <AutomationDetailsMainContentTriggerCondition automationId={automationId} />
          </AutomationDetailsMainContentBlockWrapper>
        </>
      ) : (
        <AutomationDetailsMainContentAddNodeButton
          label={t("automations.trigger.add_trigger")}
          isSelected={isCreateTriggerNodeSelected}
          onClick={() =>
            sidebarHelper?.setSelectedSidebarConfig({ tab: EAutomationSidebarTab.TRIGGER, mode: "create" })
          }
        />
      )}
    </AutomationDetailsMainContentSectionWrapper>
  );
});
