import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EAutomationSidebarTab } from "@plane/types";
import { getSidebarHeaderI18nTitle } from "@plane/utils";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
// local imports
import { AutomationDetailsSidebarActivityHeaderFilters } from "./activity/header-filters";

type Props = {
  automationId: string;
};

export const AutomationDetailsSidebarHeader: React.FC<Props> = observer((props) => {
  const { automationId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  // derived values
  const automation = getAutomationById(automationId);
  const sidebarHelper = automation?.sidebarHelper;
  const selectedSidebarTab = sidebarHelper?.selectedSidebarConfig?.tab;
  const isActivityTab = selectedSidebarTab === EAutomationSidebarTab.ACTIVITY;
  // translation
  const { t } = useTranslation();
  // derived values
  const sidebarHeaderI18nTitle = selectedSidebarTab ? getSidebarHeaderI18nTitle(selectedSidebarTab) : "";

  return (
    <header className="shrink-0 px-6 pt-6 flex items-center justify-between gap-2">
      <h2 className="text-sm">{t(sidebarHeaderI18nTitle)}</h2>
      <div className="shrink-0 flex items-center gap-2">
        {isActivityTab && <AutomationDetailsSidebarActivityHeaderFilters automationId={automationId} />}
        <button
          type="button"
          className="shrink-0 size-5 grid place-items-center"
          onClick={() => sidebarHelper?.setSelectedSidebarConfig({ tab: null, mode: null })}
        >
          <X className="size-4" />
        </button>
      </div>
    </header>
  );
});
