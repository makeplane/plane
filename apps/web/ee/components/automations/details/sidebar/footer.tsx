import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { InitiativeIcon } from "@plane/propel/icons";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
};

export const AutomationDetailsSidebarFooter: React.FC<TProps> = observer((props) => {
  const { automationId } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;

  if (!sidebarHelper) return null;
  return (
    <footer className="flex-shrink-0 px-6 pb-6">
      {sidebarHelper.isPublishAlertOpen && (
        <div
          className="bg-custom-background-80 text-custom-text-200 rounded-lg p-3 flex items-start gap-2.5"
          role="status"
        >
          <span className="flex-shrink-0 size-4 grid place-items-center">
            <InitiativeIcon className="size-3" />
          </span>
          <p className="text-xs">{t("automations.enable.alert")}</p>
          <button
            type="button"
            onClick={() => {
              sidebarHelper.setIsPublishAlertOpen(false);
            }}
            className="flex-shrink-0 size-4 grid place-items-center hover:text-custom-text-100 transition-colors"
            aria-label="Close alert"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </footer>
  );
});
