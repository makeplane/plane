import { MessageCircle, Users } from "lucide-react";
import { TAutomationTriggerIconKey } from "@plane/constants";
import { DoubleCircleIcon, LayersIcon } from "@plane/propel/icons";

type Props = {
  iconKey: TAutomationTriggerIconKey;
};

const COMMON_ICON_CLASSNAME = "size-3.5 flex-shrink-0";

export const AutomationTriggerIcon: React.FC<Props> = (props) => {
  switch (props.iconKey) {
    case "LayersIcon":
      return <LayersIcon className={COMMON_ICON_CLASSNAME} />;
    case "DoubleCircleIcon":
      return <DoubleCircleIcon className={COMMON_ICON_CLASSNAME} />;
    case "Users":
      return <Users className={COMMON_ICON_CLASSNAME} />;
    case "MessageCircle":
      return <MessageCircle className={COMMON_ICON_CLASSNAME} />;
    default:
      return null;
  }
};
