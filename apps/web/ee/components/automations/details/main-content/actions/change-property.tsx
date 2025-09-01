import { useMemo } from "react";
import { PencilLine } from "lucide-react";
// plane imports
import { EAutomationChangeType, type TChangePropertyActionConfig } from "@plane/types";
import { getAutomationChangePropertyTypeLabel } from "@plane/utils";
// plane web imports
import { useAutomationActionConfig } from "@/plane-web/hooks/automations/use-automation-action-config";

type Props = {
  config: TChangePropertyActionConfig;
  projectId: string;
};

export const AutomationDetailsMainContentChangePropertyBlock: React.FC<Props> = (props) => {
  const { config, projectId } = props;
  const { configurationMap } = useAutomationActionConfig({
    projectId,
  });
  const propertyValue = useMemo(() => {
    if (!config.property_value) return null;
    const propertyDetails = configurationMap[config.property_name];
    return propertyDetails.getPreviewContent(config.property_value);
  }, [config.property_name, config.property_value, configurationMap]);

  const description: React.ReactNode = useMemo(() => {
    if (config.change_type === EAutomationChangeType.ADD) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-custom-text-100">
          <span className="shrink-0 text-custom-text-300">add</span> {propertyValue}
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.REMOVE) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-custom-text-100">
          <span className="shrink-0 text-custom-text-300">remove</span> {propertyValue}
        </p>
      );
    } else if (config.change_type === EAutomationChangeType.UPDATE) {
      return (
        <p className="flex items-center gap-1 flex-wrap text-custom-text-100">
          <span className="shrink-0 text-custom-text-300">set to</span> {propertyValue}
        </p>
      );
    }
    return "";
  }, [config, propertyValue]);

  return (
    <div className="flex gap-2">
      <span className="flex-shrink-0 size-12 rounded-full bg-custom-background-80 grid place-items-center">
        <PencilLine className="size-5 text-custom-text-300" />
      </span>
      <div className="text-sm text-custom-text-300 font-medium">
        <p>
          Update the work item{" "}
          <span className="text-custom-text-100">{getAutomationChangePropertyTypeLabel(config.property_name)}</span>
        </p>
        {description}
      </div>
    </div>
  );
};
