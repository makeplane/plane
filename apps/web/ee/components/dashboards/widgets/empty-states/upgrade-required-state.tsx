import { observer } from "mobx-react";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionTextAndBackgroundColor } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web stores
import { DashboardWidgetInstance } from "@/plane-web/store/dashboards/widget";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetUpgradeRequiredState: React.FC<Props> = observer((props) => {
  const { activeBreakpoint, widget } = props;
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const { chart_type, height } = widget ?? {};
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  // translation
  const { t } = useTranslation();
  // resolved asset
  const resolvedPath = useResolvedAssetPath({
    basePath: `/empty-state/dashboards/widgets/charts/${chart_type?.toLowerCase()}`,
  });

  return (
    <div className="size-full grid place-items-center px-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t("dashboards.widget.upgrade_required.title")}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        <p className="text-sm text-custom-text-400 text-center whitespace-pre-line">
          Upgrade to{" "}
          <button
            type="button"
            onClick={() => togglePaidPlanModal(true)}
            className={cn(
              "px-0.5 py-px rounded outline-none",
              getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.BUSINESS)
            )}
          >
            {getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}
          </button>{" "}
          to use this widget type.
        </p>
      </div>
    </div>
  );
});
