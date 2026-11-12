/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import React from "react";
import type { IAnalyticsResponseFields } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
import { cn } from "@plane/utils";

export type InsightCardProps = {
  data?: IAnalyticsResponseFields;
  label: string;
  isLoading?: boolean;
};

function InsightCard(props: InsightCardProps) {
  const { data, label, isLoading = false } = props;
  const count = data?.count ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-body-xs-regular text-tertiary">{label}</div>
      {/* The count stays mounted (hidden) while loading so the row keeps one height in both states. */}
      <div className="relative">
        <div className={cn("text-h4-bold text-primary", { invisible: isLoading })}>{count}</div>
        {isLoading && (
          <Loader className="absolute inset-x-0 inset-y-1">
            <Loader.Item height="100%" width="100%" />
          </Loader>
        )}
      </div>
    </div>
  );
}

export default InsightCard;
