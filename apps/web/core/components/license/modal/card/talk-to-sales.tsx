/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// types
// plane imports
import { Button } from "@makeplane/propel/components/button";
import type { EProductSubscriptionEnum, IPaymentProduct, TSubscriptionPrice } from "@plane/types";
import { Loader } from "@plane/ui";
// local imports
import { BasePaidPlanCard } from "./base-paid-plan-card";

export type TalkToSalesCardProps = {
  planVariant: EProductSubscriptionEnum;
  href: string;
  isLoading?: boolean;
  features: string[];
  product: IPaymentProduct | undefined;
  prices: TSubscriptionPrice[];
  upgradeLoaderType: Omit<EProductSubscriptionEnum, "FREE"> | undefined;
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
  isSelfHosted: boolean;
  isTrialAllowed: boolean;
  renderTrialButton?: (props: { productId: string | undefined; priceId: string | undefined }) => React.ReactNode;
};

export const TalkToSalesCard = observer(function TalkToSalesCard(props: TalkToSalesCardProps) {
  const {
    planVariant,
    href,
    features,
    product,
    prices,
    isLoading,
    verticalFeatureList = false,
    extraFeatures,
    upgradeLoaderType,
    isSelfHosted,
    isTrialAllowed,
    renderTrialButton,
  } = props;

  const renderPriceContent = (price: TSubscriptionPrice) => (
    <>
      {price.recurring === "month" && "Monthly"}
      {price.recurring === "year" && "Yearly"}
    </>
  );

  const renderActionButton = (price: TSubscriptionPrice) => (
    <>
      <div className="pb-4 text-center">
        <div className="flex h-9 items-center justify-center text-20 font-semibold">
          {isLoading ? (
            <Loader className="flex flex-col items-center justify-center">
              <Loader.Item height="36px" width="4rem" />
            </Loader>
          ) : (
            <>Quote on request</>
          )}
        </div>
        <div className="text-caption-md-medium text-tertiary">per user per month</div>
      </div>
      {isLoading ? (
        <Loader className="flex flex-col items-center justify-center">
          <Loader.Item height="38px" width="14rem" />
        </Loader>
      ) : (
        <div className="flex w-full flex-col items-center justify-center">
          <span className="w-56">
            <Button
              variant="primary"
              size="md"
              stretch="full"
              label="Talk to Sales"
              nativeButton={false}
              render={<a href={href} target="_blank" rel="noreferrer" />}
            />
          </span>
          {isTrialAllowed && !isSelfHosted && (
            <div className="mt-4 h-4">
              {renderTrialButton &&
                renderTrialButton({
                  productId: product?.id,
                  priceId: price.id,
                })}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <BasePaidPlanCard
      planVariant={planVariant}
      features={features}
      prices={prices}
      upgradeLoaderType={upgradeLoaderType}
      verticalFeatureList={verticalFeatureList}
      extraFeatures={extraFeatures}
      renderPriceContent={renderPriceContent}
      renderActionButton={renderActionButton}
    />
  );
});
