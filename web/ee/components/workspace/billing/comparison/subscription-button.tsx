import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum, EProductSubscriptionTier } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IPaymentProduct } from "@plane/types";
import { Button, getButtonStyling, Loader } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web imports
import { getUpgradeButtonStyle } from "@/components/workspace/billing/subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

const COMMON_BUTTON_STYLE =
  "relative inline-flex items-center justify-center w-full px-4 py-1.5 text-xs font-medium rounded-lg focus:outline-none transition-all duration-300 animate-slide-up";

type TSubscriptionButtonProps = {
  subscriptionType: EProductSubscriptionEnum;
  isProductsAPILoading: boolean;
  currentProduct: IPaymentProduct | undefined;
  upgradeLoader: EProductSubscriptionEnum | null;
  handleSubscriptionUpgrade: (subscriptionType: EProductSubscriptionEnum) => void;
};

export const SubscriptionButton: FC<TSubscriptionButtonProps> = observer((props) => {
  const { subscriptionType, isProductsAPILoading, currentProduct, upgradeLoader, handleSubscriptionUpgrade } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const currentPlan = subscriptionDetail?.product ?? EProductSubscriptionEnum.FREE;
  const subscriptionName = getSubscriptionName(subscriptionType);
  const isOnTrialPeriod = !!subscriptionDetail?.is_on_trial && !subscriptionDetail?.has_added_payment_method;
  const showCurrentSubscriptionButton = currentPlan === subscriptionType && !isOnTrialPeriod;
  const isHigherTierPlan = EProductSubscriptionTier[subscriptionType] >= EProductSubscriptionTier[currentPlan];
  const showUpgradeButton = isHigherTierPlan && (isOnTrialPeriod || currentPlan !== subscriptionType);
  const upgradeButtonStyle =
    getUpgradeButtonStyle(subscriptionType, !!upgradeLoader) ?? getButtonStyling("primary", "lg", !!upgradeLoader);

  if (!subscriptionDetail || isProductsAPILoading) {
    return (
      <Loader className="w-full h-full">
        <Loader.Item height="30px" width="100%" />
      </Loader>
    );
  }

  if (showCurrentSubscriptionButton) {
    return (
      <Button variant="neutral-primary" size="sm" className={cn(COMMON_BUTTON_STYLE)} disabled>
        Current plan
      </Button>
    );
  }

  if (showUpgradeButton) {
    const getButtonText = () => {
      if (!currentProduct?.is_active) {
        return t("common.upgrade_cta.talk_to_sales");
      }
      if (upgradeLoader === subscriptionType) {
        return "Redirecting to Stripe";
      }
      return `Upgrade to ${subscriptionName}`;
    };

    return (
      <button
        onClick={() => handleSubscriptionUpgrade(subscriptionType)}
        className={cn(upgradeButtonStyle, COMMON_BUTTON_STYLE)}
        disabled={!!upgradeLoader}
      >
        {getButtonText()}
      </button>
    );
  }

  return null;
});
