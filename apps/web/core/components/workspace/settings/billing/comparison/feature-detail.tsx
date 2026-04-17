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

import { CheckCircle2, Minus, MinusCircle } from "lucide-react";
import type { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";
// constants
import type { TPlanFeatureData } from "@/constants/plans";

type TPlanFeatureDetailProps = {
  subscriptionType: EProductSubscriptionEnum;
  data: TPlanFeatureData;
};

export function PlanFeatureDetail(props: TPlanFeatureDetailProps) {
  const { subscriptionType, data } = props;

  if (data === null || data === undefined) {
    return <Minus className="size-4 text-placeholder" />;
  }
  if (data === true) {
    return <CheckCircle2 className="size-4 text-accent-primary" />;
  }
  if (data === false) {
    return <MinusCircle className="size-4 text-placeholder" />;
  }
  return <>{data}</>;
}
