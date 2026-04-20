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

import { orderBy } from "lodash-es";
import type { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";

/**
 * Retrieves a subscription product based on the subscription type
 * @param subscriptionType - The type of subscription to find
 * @returns The matching subscription product or undefined if not found
 */
export const getSubscriptionProduct = (
  products: IPaymentProduct[] | undefined,
  subscriptionType: EProductSubscriptionEnum
): IPaymentProduct | undefined => products?.find((product: IPaymentProduct) => product?.type === subscriptionType);

/**
 * Retrieves the price for a subscription product based on frequency
 * @param subscriptionType - The type of subscription to get price for
 * @param frequency - Optional billing frequency ('month' or 'year')
 * @returns The matching price object or null if not found
 *
 * @remarks
 * - If no frequency is provided, returns the first available price (used for Plane One)
 * - For other subscriptions, returns the price matching the specified frequency
 * - Prices are ordered by recurring type in descending order
 */
export const getSubscriptionProductPrice = (
  product: IPaymentProduct | undefined,
  frequency?: "month" | "year"
): IPaymentProductPrice | null => {
  if (!product?.prices?.length) return null;

  // For Plane One, return the first available price
  if (!frequency) return product.prices[0];

  // Sort prices by recurring type and find matching frequency
  const sortedPrices = orderBy(product.prices, ["recurring"], ["desc"]);
  return sortedPrices.find((price) => price.recurring === frequency) ?? null;
};

/**
 * Determines if a subscription is active based on its type and product status
 * @param subscriptionType - The type of subscription (FREE, ONE, PRO, BUSINESS, ENTERPRISE)
 * @param product - The payment product associated with the subscription
 * @returns boolean indicating if the subscription is active
 *
 * @remarks
 * - FREE subscriptions are always considered active
 * - ONE subscriptions are always considered inactive
 * - For other subscription types, the status depends on the product's is_active flag
 */
export const getSubscriptionProductStatus = (
  subscriptionType: EProductSubscriptionEnum,
  product: IPaymentProduct | undefined
): boolean => {
  if (subscriptionType === EProductSubscriptionEnum.FREE) return true;
  if (subscriptionType === EProductSubscriptionEnum.ONE) return false;
  return product?.is_active ?? false;
};

export const shouldRenderPlanDetail = (planKey: EProductSubscriptionEnum) => {
  // Free plan is not required to be shown in the comparison
  if (planKey === EProductSubscriptionEnum.FREE) return false;
  // Plane one plan is not longer available
  if (planKey === EProductSubscriptionEnum.ONE) return false;
  return true;
};
