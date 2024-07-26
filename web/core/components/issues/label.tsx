"use client";

import React from "react";
// components
import { Tooltip } from "@plane/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";
type Props = {
  labelDetails: any[];
  maxRender?: number;
};

export const ViewIssueLabel: React.FC<Props> = ({ labelDetails, maxRender = 1 }) => {
  const { isMobile } = usePlatformOS();
  return (
    <>
      {labelDetails?.length > 0 ? (
        labelDetails.length <= maxRender ? (
          <>
            {labelDetails.map((label) => (
              <div
                key={label.id}
                className="flex flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm"
              >
                <Tooltip position="top" tooltipHeading="Label" tooltipContent={label.name} isMobile={isMobile}>
                  <div className="flex items-center gap-1.5 text-custom-text-200">
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
          <div className="flex flex-shrink-0 cursor-default items-center rounded-md border border-custom-border-300 px-2.5 py-1 text-xs shadow-sm">
            <Tooltip
              position="top"
              tooltipHeading="Labels"
              tooltipContent={labelDetails.map((l) => l.name).join(", ")}
              isMobile={isMobile}
            >
              <div className="flex items-center gap-1.5 text-custom-text-200">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
                {`${labelDetails.length} Labels`}
              </div>
            </Tooltip>
          </div>
        )
      ) : (
        ""
      )}
    </>
  );
};
