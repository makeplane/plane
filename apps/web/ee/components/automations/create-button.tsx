// plane imports
import { AUTOMATION_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, TButtonVariant } from "@plane/ui";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  variant?: TButtonVariant;
};

export const CreateAutomationButton = (props: TProps) => {
  const { variant = "primary" } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    projectAutomations: { setCreateUpdateModalConfig },
  } = useAutomations();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={() => {
        captureClick({ elementName: AUTOMATION_TRACKER_ELEMENTS.HEADER_CREATE_BUTTON });
        setCreateUpdateModalConfig({ isOpen: true, payload: null });
      }}
    >
      {t("automations.settings.create_automation")}
    </Button>
  );
};
