import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LayersIcon } from "@plane/ui";
// local imports
import { AutomationDetailsMainContentBlockWrapper } from "../common/block-wrapper";
import { AutomationDetailsMainContentSectionWrapper } from "../common/section-wrapper";

type TProps = {
  automationId: string;
};

export const AutomationDetailsMainContentScopeRoot: React.FC<TProps> = observer(() => {
  // translation
  const { t } = useTranslation();

  return (
    <AutomationDetailsMainContentSectionWrapper title={t("automations.scope.label")}>
      <AutomationDetailsMainContentBlockWrapper>
        <p className="leading-4 text-sm text-custom-primary-100 font-medium font-mono uppercase">
          {t("automations.scope.run_on")}
        </p>
        <div className="flex items-center gap-2">
          <span className="flex-shrink-0 size-12 rounded-full bg-custom-primary-100/20 grid place-items-center">
            <LayersIcon className="size-5 text-custom-primary-100" />
          </span>
          <p className="text-sm font-medium">{t("common.work_items")}</p>
        </div>
      </AutomationDetailsMainContentBlockWrapper>
    </AutomationDetailsMainContentSectionWrapper>
  );
});
