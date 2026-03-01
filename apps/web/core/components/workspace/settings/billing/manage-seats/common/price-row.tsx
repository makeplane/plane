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

import { cn } from "@plane/utils";

type PriceRowProps = {
  label: string;
  amount: number;
  quantity?: number;
  pricePerUnit?: number;
  isTotal?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
  interval: "MONTHLY" | "YEARLY";
};

export function PriceRow(props: PriceRowProps) {
  const { label, amount, quantity, pricePerUnit, className, rightElement, interval } = props;

  return (
    <div className={cn("w-full flex gap-1.5 justify-between", className)}>
      <div className="text-13 font-medium text-primary">
        {quantity && pricePerUnit ? (
          <>{`${quantity} ${label} x $${(pricePerUnit / 100).toFixed(2)} / ${interval === "MONTHLY" ? "month" : "year"}`}</>
        ) : (
          label
        )}
      </div>
      <div className="flex items-center gap-2">
        {rightElement}
        <div className="text-13 font-medium text-primary">
          ${amount ? (amount / 100).toFixed(2) : "0.00"} / {interval === "MONTHLY" ? "month" : "year"}
        </div>
      </div>
    </div>
  );
}
