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
import { BILLING_FREQUENCIES } from "@plane/constants";
import { ExternalLinkIcon } from "@plane/propel/icons";
import { Tabs } from "@plane/propel/tabs";
import type { TBillingFrequency } from "@plane/types";

type PlanFrequencyToggleProps = {
  selectedFrequency: TBillingFrequency;
  setSelectedFrequency: (frequency: TBillingFrequency) => void;
};

export const PlanFrequencyToggle = function PlanFrequencyToggle(props: PlanFrequencyToggleProps) {
  const { selectedFrequency, setSelectedFrequency } = props;

  return (
    <div className="flex flex-wrap sm:flex-nowrap justify-between gap-2 text-body-xs-medium w-full sm:w-auto">
      <a
        href="https://plane.so/pricing#features"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-secondary text-nowrap"
      >
        View detailed comparision
        <ExternalLinkIcon className="size-4 shrink-0" />
      </a>

      <Tabs defaultValue={selectedFrequency} onValueChange={(value) => setSelectedFrequency(value)}>
        <Tabs.List className="flex items-center gap-1 text-primary rounded-lg p-0.5 w-fit bg-layer-3 h-7">
          {BILLING_FREQUENCIES.map((freq) => (
            <Tabs.Trigger key={freq.value} value={freq.value} size="sm">
              {freq.name}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs>
    </div>
  );
};
