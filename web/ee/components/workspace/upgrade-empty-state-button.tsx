import { FC } from "react";
import { observer } from "mobx-react";
import { Crown } from "lucide-react";
// plane imports
import {
  EProductSubscriptionEnum,
  EProductSubscriptionTier,
  FEATURE_TO_BASE_PLAN_MAP,
  TSupportedFlagsForUpgrade,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TProductSubscriptionType } from "@plane/types";
import { Button, getButtonStyling } from "@plane/ui";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useFlag } from "@/plane-web/hooks/store/use-flag";

type TUpgradeEmptyStateButtonProps = {
  workspaceSlug: string;
  flag: TSupportedFlagsForUpgrade;
};

export const UpgradeEmptyStateButton: FC<TUpgradeEmptyStateButtonProps> = observer(
  (props: TUpgradeEmptyStateButtonProps) => {
    const { workspaceSlug, flag } = props;
    // plane hooks
    const { t } = useTranslation();
    // store hooks
    const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, togglePaidPlanModal } =
      useWorkspaceSubscription();
    if (!subscriptionDetail) return null;
    // derived values
    const isFeatureFlagEnabled = useFlag(workspaceSlug, flag);
    const isOnFreePlan = subscriptionDetail.product === EProductSubscriptionEnum.FREE;
    const isPlaneOneInstance =
      subscriptionDetail.is_self_managed && subscriptionDetail.product === EProductSubscriptionEnum.ONE;
    const basePlanForCurrentFeature = FEATURE_TO_BASE_PLAN_MAP[flag] as TProductSubscriptionType | undefined;
    const isFeatureAvailableForCurrentPlan =
      !!basePlanForCurrentFeature &&
      EProductSubscriptionTier[subscriptionDetail.product] >= EProductSubscriptionTier[basePlanForCurrentFeature];

    // Free Plan + Feature Not Enabled = Upgrade Button
    if (isOnFreePlan && !isFeatureFlagEnabled) {
      return (
        <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
          <Crown className="h-3.5 w-3.5" />
          {t("common.upgrade")}
        </Button>
      );
    }

    // Plane One Instance + Feature Not Enabled = Prime Upgrade Link
    if (isPlaneOneInstance && !isFeatureFlagEnabled) {
      return (
        <a
          href="https://prime.plane.so/"
          target="_blank"
          rel="noopener noreferrer"
          className={getButtonStyling("primary", "md")}
        >
          {t("common.upgrade_cta.higher_subscription")}
        </a>
      );
    }

    // Feature Available for Plan + Feature Not Enabled = Coming Soon
    if (isFeatureAvailableForCurrentPlan && !isFeatureFlagEnabled) {
      return (
        <Button variant="primary" disabled>
          <Crown className="h-3.5 w-3.5" />
          {t("common.coming_soon")}
        </Button>
      );
    }

    // Feature Available for Plan + Feature Enabled = Contact Support
    // Edge case: If feature is available for current plan and feature flag is enabled, show the contact support button
    if (isFeatureAvailableForCurrentPlan && isFeatureFlagEnabled) {
      return (
        <a
          href="mailto:support@plane.so"
          target="_blank"
          rel="noopener noreferrer"
          className={getButtonStyling("primary", "md")}
        >
          Contact support
        </a>
      );
    }

    // Fallback: Default Upgrade Button
    return (
      <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
        <Crown className="h-3.5 w-3.5" />
        {t("common.upgrade")}
      </Button>
    );
  }
);
