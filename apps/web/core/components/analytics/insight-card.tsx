/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import React from "react";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
import type { IAnalyticsResponseFields } from "@plane/types";

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
      <div className="text-13 text-tertiary">{label}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          <div className="text-20 font-bold text-primary">{count}</div>
        </div>
      ) : (
        <Skeleton aria-label="Loading insight">
          <SkeletonItem blockSize="50px" />
        </Skeleton>
      )}
    </div>
  );
}

export default InsightCard;
