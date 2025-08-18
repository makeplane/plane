import { observer } from "mobx-react";
import { Zap } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import { CreateAutomationButton } from "./create-button";

export const NoAutomationsEmptyState = observer(() => {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 px-4 py-10 border-b border-custom-border-100">
      <span className="flex flex-shrink-0 items-center justify-center size-8 rounded bg-custom-background-80/70">
        <Zap className="size-4 text-custom-text-300" strokeWidth={1.5} />
      </span>
      <p className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-custom-text-200">
          {t("automations.empty_state.no_automations.title")}
        </span>
        <span className="text-xs text-custom-text-300">{t("automations.empty_state.no_automations.description")}</span>
      </p>
      <CreateAutomationButton variant="accent-primary" />
    </div>
  );
});
