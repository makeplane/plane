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

import { useState } from "react";
// plane imports
import type { TAgentRunActivity } from "@plane/types";
import { cn } from "@plane/utils";

// Unwrap JSON-encoded strings (e.g., "\"input\"" → "input"), pass through plain strings
const unwrapJsonString = (value?: string): string => {
  if (!value) return "";
  // Only attempt to parse if it looks like a JSON string (wrapped in quotes)
  if (value.startsWith('"') && value.endsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === "string" ? parsed : value;
    } catch {
      return value;
    }
  }
  return value;
};

const CustomAccordion = (props: {
  children: React.ReactNode;
  title: React.ReactNode;
  buttonSize?: string;
  className?: string;
  defaultOpen?: boolean;
}) => {
  const { children, title, className, defaultOpen } = props;
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  return (
    <div className={cn("flex flex-col")}>
      <button className={cn("flex items-center gap-2 group", className)} onClick={() => setIsOpen(!isOpen)}>
        {title}

        <span
          className={cn(
            `opacity-0 group-hover:opacity-100 text-9 size-3.5 transition-transform duration-500 ease-in-out ${isOpen ? "transform rotate-180" : ""}`
          )}
        >
          ▼
        </span>
      </button>
      <div
        className={cn(
          "overflow-scroll flex flex-col gap-3 relative",
          "transition-all duration-500 ease-in-out",
          isOpen ? "max-h-[300px] opacity-100 mb-3 " : "max-h-0 opacity-0 mt-0"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const AgentWork = (props: { activities: TAgentRunActivity[]; isThinking: boolean }) => {
  const { activities, isThinking } = props;

  return (
    <CustomAccordion
      className="mb-3"
      defaultOpen={true}
      title={
        <span
          className={cn("text-body-xs-regular text-secondary hover:text-tertiary", {
            shimmer: isThinking,
          })}
        >
          Worked for a few seconds
        </span>
      }
    >
      {activities?.map((activity: TAgentRunActivity) => {
        switch (activity.content.type) {
          case "thought":
            return (
              <div className="text-placeholder relative flex flex-col gap-1" key={activity.id}>
                <div className="text-caption-md-regular">{activity.content.body}</div>
              </div>
            );
          case "action":
            return (
              <div className="text-disabled relative flex flex-col gap-1" key={activity.id}>
                <CustomAccordion
                  title={
                    <div className="text-caption-md-regular rounded-md w-fit text-start">
                      {activity.content.action} &nbsp;
                      <span className="text-caption-md-regular text-placeholder">
                        {unwrapJsonString(JSON.stringify(activity.content.parameters?.input))}
                      </span>
                    </div>
                  }
                  buttonSize="sm"
                  className="mb-1"
                >
                  <div className="text-caption-md-regular rounded-md w-fit break-words">
                    {unwrapJsonString(JSON.stringify(activity.content.parameters?.result))}
                  </div>
                </CustomAccordion>
              </div>
            );
          case "error":
            return (
              <div className="text-error relative flex flex-col gap-1" key={activity.id}>
                <div className="text-caption-md-regular text-danger-secondary">{activity.content.body}</div>
              </div>
            );
        }
      })}
    </CustomAccordion>
  );
};
