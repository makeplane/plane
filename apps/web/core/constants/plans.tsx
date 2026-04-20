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

// plane imports
import type { TProductSubscriptionType } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  name: React.ReactNode;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescription?: React.ReactNode;
  yearlyPriceSecondaryDescription?: React.ReactNode;
  buttonCTA?: React.ReactNode;
  isActive: boolean;
};

type PlanePlans = {
  planDetails: Record<TProductSubscriptionType, TPlanDetail>;
  planHighlights: Record<TProductSubscriptionType, string[]>;
};

export const PLANE_PLANS: PlanePlans = {
  planDetails: {
    [EProductSubscriptionEnum.FREE]: {
      id: EProductSubscriptionEnum.FREE,
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      isActive: true,
    },
    [EProductSubscriptionEnum.ONE]: {
      id: EProductSubscriptionEnum.ONE,
      name: "One",
      monthlyPrice: 799,
      yearlyPrice: 799,
      monthlyPriceSecondaryDescription: "per workspace",
      yearlyPriceSecondaryDescription: "per workspace",
      buttonCTA: "Upgrade",
      isActive: false,
    },
    [EProductSubscriptionEnum.PRO]: {
      id: EProductSubscriptionEnum.PRO,
      name: "Pro",
      monthlyPrice: 8,
      yearlyPrice: 6,
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Upgrade",
      isActive: true,
    },
    [EProductSubscriptionEnum.BUSINESS]: {
      id: EProductSubscriptionEnum.BUSINESS,
      name: "Business",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
    [EProductSubscriptionEnum.ENTERPRISE]: {
      id: EProductSubscriptionEnum.ENTERPRISE,
      name: "Enterprise",
      monthlyPriceSecondaryDescription: "billed monthly",
      yearlyPriceSecondaryDescription: "billed yearly",
      buttonCTA: "Talk to Sales",
      isActive: false,
    },
  },
  planHighlights: {
    [EProductSubscriptionEnum.FREE]: ["Upto 12 users", "Pages", "Unlimited projects", "Unlimited cycles and modules"],
    [EProductSubscriptionEnum.ONE]: ["Upto 50 users", "OIDC and SAML", "Active cycles", "Limited time tracking"],
    [EProductSubscriptionEnum.PRO]: [
      "Work Items Types and Properties",
      "Workspace Wiki",
      "Time Tracking and Work Logs",
      "Work Item and Page Templates",
      "Dashboards",
      "Epics and Initiatives",
      "Teamspaces",
    ],
    [EProductSubscriptionEnum.BUSINESS]: [
      "Project Templates",
      "Recurring Work Items",
      "Intake Email and Forms",
      "Nested Pages and Embeds",
      "Single Workflow",
      "Customers",
      "Dashboards with Advanced Widgets",
    ],
    [EProductSubscriptionEnum.ENTERPRISE]: [
      "Private + managed deployments",
      "Granular Access Control",
      "Multiple Workflows + Approvals",
      "LDAP support",
      "Migration and Implementation Services",
    ],
  },
};
