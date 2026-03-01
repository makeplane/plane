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
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { EProductSubscriptionEnum } from "@plane/types";

type TProps = {
  subscriptionType: EProductSubscriptionEnum;
  handleClick: () => void;
  children: React.ReactNode;
  className?: string;
  tooltipContent?: string;
  showTooltip?: boolean;
};

export function SubscriptionButton(props: TProps) {
  const { handleClick, children, className, tooltipContent, showTooltip = false } = props;

  return (
    <Tooltip disabled={!showTooltip} tooltipContent={tooltipContent}>
      <Button variant="tertiary" size="lg" className={className} onClick={handleClick}>
        {children}
      </Button>
    </Tooltip>
  );
}
