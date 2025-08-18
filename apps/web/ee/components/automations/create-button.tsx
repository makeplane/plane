// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, TButtonVariant } from "@plane/ui";
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
        setCreateUpdateModalConfig({ isOpen: true, payload: null });
      }}
    >
      {t("automations.settings.create_automation")}
    </Button>
  );
};
