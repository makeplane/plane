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

import { observer } from "mobx-react";
// plane imports
import { NewTabIcon } from "@plane/propel/icons";
import { getButtonStyling } from "@plane/propel/button";
import { EProductSubscriptionEnum } from "@plane/types";
// plane web components
import { PlanCard, SelfManagedLicenseActions } from "@/components/workspace/license";

export const OnePlanCard = observer(function OnePlanCard() {
  return (
    <PlanCard
      planVariant={EProductSubscriptionEnum.ONE}
      planDescription={
        <>
          <div>Active cycles, Time Tracking, Public View + Pages, ~50 Members</div>
          <SelfManagedLicenseActions />
        </>
      }
      control={
        <a
          href="https://prime.plane.so/"
          className={getButtonStyling("primary", "lg")}
          target="_blank"
          rel="noreferrer"
        >
          Manage your license
          <NewTabIcon className="shrink-0 size-3" strokeWidth={2} />
        </a>
      }
    />
  );
});
