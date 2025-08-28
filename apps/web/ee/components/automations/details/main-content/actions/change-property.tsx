import { useMemo } from "react";
import { PencilLine } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationChangeType, type TChangePropertyActionConfig } from "@plane/types";
import { getAutomationChangePropertyTypeLabel } from "@plane/utils";
// plane web imports
import { useAutomationActionConfig } from "@/plane-web/hooks/automations/use-automation-action-config";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
  config: TChangePropertyActionConfig;
  projectId: string;
};

export const AutomationDetailsMainContentChangePropertyBlock: React.FC<Props> = (props) => {
  const { automationId, config, projectId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const {} = getAutomationById(automationId) ?? {};
  const { configurationMap } = useAutomationActionConfig({
    projectId,
  });
  const propertyValue = useMemo(() => {
    if (!config.property_value) return null;
    const propertyDetails = configurationMap[config.property_name];
    return propertyDetails.getPreviewContent(config.property_value);
  }, [config.property_name, config.property_value, configurationMap]);
  // translation
  const { t } = useTranslation();

  const description: React.ReactNode = useMemo(() => {
    if (config.change_type === EAutomationChangeType.ADD) {
      return (
        <p>
          add <span className="text-custom-text-100">{propertyValue}</span> to{" "}
          <span className="text-custom-text-100">{getAutomationChangePropertyTypeLabel(config.property_name)}</span>
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.REMOVE) {
      return (
        <p>
          remove <span className="text-custom-text-100">{propertyValue}</span> from{" "}
          <span className="text-custom-text-100">{getAutomationChangePropertyTypeLabel(config.property_name)}</span>
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.UPDATE) {
      return (
        <p>
          update{" "}
          <span className="text-custom-text-100">{getAutomationChangePropertyTypeLabel(config.property_name)}</span> to{" "}
          <span className="text-custom-text-100">{propertyValue}</span>
        </p>
      );
    }
    return "";
  }, [config, propertyValue]);

  return (
    <div className="flex items-center gap-2">
      <span className="flex-shrink-0 size-12 rounded-full bg-custom-background-80 grid place-items-center">
        <PencilLine className="size-5 text-custom-primary-100" />
      </span>
      <div className="text-sm text-custom-text-300 font-medium">
        <p>{t("automations.action.change_property_block.title")}</p>
        {description}
      </div>
    </div>
  );
};
