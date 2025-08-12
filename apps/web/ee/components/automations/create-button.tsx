// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

export const CreateAutomationButton = () => {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    projectAutomations: { setCreateUpdateModalConfig },
  } = useAutomations();

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={() => {
        setCreateUpdateModalConfig({ isOpen: true, payload: null });
      }}
    >
      {t("automations.settings.create_automation")}
    </Button>
  );
};
