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

import { DEFAULT_EXTERNAL_UPGRADE_PLAN, EExternalUpgradePlanType } from "@plane/constants";
import type { EExternalUpgradeEditionType } from "@plane/constants";
import { EProductSubscriptionEnum } from "@plane/types";
import type { IPaymentProductPrice } from "@plane/types";

export const getBaseUpgradePath = (planType: EExternalUpgradePlanType) => `/upgrade/${planType}`;

export const getDefaultUpgradePath = () => getBaseUpgradePath(DEFAULT_EXTERNAL_UPGRADE_PLAN);

export const getEditionUpgradePath = (planType: EExternalUpgradePlanType, edition: EExternalUpgradeEditionType) =>
  `${getBaseUpgradePath(planType)}/${edition}`;

export const getSubscriptionTypeFromExternalUpgradePlanTypeEnum = (planType: EExternalUpgradePlanType) => {
  const SUBSCRIPTION_TYPE_MAP = {
    [EExternalUpgradePlanType.PRO]: EProductSubscriptionEnum.PRO,
    [EExternalUpgradePlanType.BUSINESS]: EProductSubscriptionEnum.BUSINESS,
    [EExternalUpgradePlanType.ENTERPRISE]: EProductSubscriptionEnum.ENTERPRISE,
  };
  return SUBSCRIPTION_TYPE_MAP[planType];
};

export type TExternalUpgradeProductPrice = Pick<IPaymentProductPrice, "currency" | "recurring" | "unit_amount"> & {
  id: string;
  redirection_link?: string | undefined;
};

export const getSelfHostedProductsForExternalUpgrade = (
  planType: EExternalUpgradePlanType
): TExternalUpgradeProductPrice[] => {
  switch (planType) {
    case EExternalUpgradePlanType.PRO:
      return [
        {
          id: "self-hosted-pro-monthly",
          currency: "$",
          recurring: "month",
          unit_amount: 800, // $8.00
          redirection_link: process.env.VITE_PRO_SELFHOSTED_MONTHLY_PAYMENT_URL || undefined,
        },
        {
          id: "self-hosted-pro-yearly",
          currency: "$",
          recurring: "year",
          unit_amount: 7200, // $72.00
          redirection_link: process.env.VITE_PRO_SELFHOSTED_YEARLY_PAYMENT_URL || undefined,
        },
      ];
    case EExternalUpgradePlanType.BUSINESS:
      return [
        {
          id: "self-hosted-business-monthly",
          currency: "$",
          recurring: "month",
          unit_amount: 1500, // $15.00
          redirection_link: process.env.VITE_BUSINESS_SELFHOSTED_MONTHLY_PAYMENT_URL || undefined,
        },
        {
          id: "self-hosted-business-yearly",
          currency: "$",
          recurring: "year",
          unit_amount: 15600, // $156.00
          redirection_link: process.env.VITE_BUSINESS_SELFHOSTED_YEARLY_PAYMENT_URL || undefined,
        },
      ];
    case EExternalUpgradePlanType.ENTERPRISE:
      return [
        {
          id: "self-hosted-enterprise-monthly",
          currency: "$",
          recurring: "month",
          unit_amount: 0,
          redirection_link: undefined,
        },
        {
          id: "self-hosted-enterprise-yearly",
          currency: "$",
          recurring: "year",
          unit_amount: 0,
          redirection_link: undefined,
        },
      ];
    default:
      return [];
  }
};
