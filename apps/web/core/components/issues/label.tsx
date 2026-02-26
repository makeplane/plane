/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// components
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { usePlatformOS } from "@/hooks/use-platform-os";
type Props = {
  labelDetails: any[];
  maxRender?: number;
};

export function ViewIssueLabel({ labelDetails, maxRender = 1 }: Props) {
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  return (
    <>
      {labelDetails?.length > 0 ? (
        labelDetails.length <= maxRender ? (
          <>
            {labelDetails.map((label) => (
              <div
                key={label.id}
                className="flex flex-shrink-0 cursor-default items-center rounded-md border border-strong px-2.5 py-1 text-11 shadow-sm"
              >
                <Tooltip position="top" tooltipHeading={t("labels")} tooltipContent={label.name} isMobile={isMobile}>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: label?.color ?? "#000000",
                      }}
                    />
                    {label.name}
                  </div>
                </Tooltip>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-shrink-0 cursor-default items-center rounded-md border border-strong px-2.5 py-1 text-11 shadow-sm">
              <Tooltip
                position="top"
                tooltipHeading={t("labels")}
                tooltipContent={labelDetails.map((l) => l.name).join(", ")}
                isMobile={isMobile}
              >
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-primary" />
                {`${labelDetails.length} ${t("labels")}`}
              </div>
            </Tooltip>
          </div>
        )
      ) : (
        ""
      )}
    </>
  );
}
