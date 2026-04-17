/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useTheme } from "next-themes";
// plane imports
import type { TBillingFrequency } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";

import ScribbleBlack from "@/app/assets/scribble/scribble-black.svg?url";
import ScribbleWhite from "@/app/assets/scribble/scribble-white.svg?url";

type TDiscountInfoProps = {
  className?: string;
  currency: string;
  frequency: TBillingFrequency;
  price: number;
  subscriptionType: EProductSubscriptionEnum;
};

const PLANS_WITH_DISCOUNT = [EProductSubscriptionEnum.PRO];

const getActualPrice = (frequency: TBillingFrequency, subscriptionType: EProductSubscriptionEnum): number | null => {
  switch (subscriptionType) {
    case EProductSubscriptionEnum.PRO:
      return frequency === "month" ? 10 : 8;
    default:
      return null;
  }
};

export function DiscountInfo({ className, currency, frequency, price, subscriptionType }: TDiscountInfoProps) {
  const { resolvedTheme } = useTheme();
  // derived values
  const actualPrice = getActualPrice(frequency, subscriptionType);

  if (!PLANS_WITH_DISCOUNT.includes(subscriptionType)) {
    return (
      <>
        {currency}
        {price}
      </>
    );
  }

  return (
    <>
      {actualPrice != price && (
        <span className={cn("relative", className)}>
          <img
            src={resolvedTheme === "dark" ? ScribbleWhite : ScribbleBlack}
            alt="scribble"
            className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-full scale-x-125"
          />
          {currency}
          {actualPrice}
        </span>
      )}
      {currency}
      {price}
    </>
  );
}
