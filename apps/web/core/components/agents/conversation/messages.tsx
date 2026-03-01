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

import { useCallback, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EAgentRunStatus } from "@plane/types";
import type { TAgentRunActivity } from "@plane/types";
import { cn } from "@plane/utils";
// hooks
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// plane-web imports
import { useAgent } from "@/plane-web/hooks/store";
// local imports
import { AgentWork } from "./agent-work";
import { ConversationLoader } from "./loader";
import { Prompt } from "./prompt";
import { LiteTextEditor } from "@/components/editor/lite-text";

type TGroupedActivity = { type: "individual" | "group"; activity: TAgentRunActivity | TAgentRunActivity[] };
type TProps = {
  workspaceId: string | undefined;
  workspaceSlug: string;
  projectId: string;
  activeRunStatus: EAgentRunStatus;
};
const nonGroupableActivityTypes = ["prompt", "elicitation", "response", "error"];
export const Messages = observer((props: TProps) => {
  const { workspaceId, workspaceSlug, projectId, activeRunStatus } = props;
  // refs
  const readOnlyEditorRef = useRef<EditorRefApi>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // state for intersection observer element
  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  // store
  const {
    activeRun,
    activeRunActivities: activities,
    activeRunPaginationInfo,
    activitiesLoader,
    fetchNextRunActivities,
  } = useAgent();
  // derived values
  const hasNextPage = activeRunPaginationInfo?.hasNextPage ?? false;
  const isLoadingMore = activitiesLoader === "pagination";
  // Reverse activities so oldest messages appear at top, newest at bottom (API returns newest first)
  const reversedActivities = useMemo(() => [...(activities ?? [])].reverse(), [activities]);

  const groupedActivities: TGroupedActivity[] = useMemo(() => {
    return reversedActivities.reduce((acc: TGroupedActivity[], activity) => {
      const isIndividual = nonGroupableActivityTypes.includes(activity.content.type);

      if (isIndividual) {
        // Individual activities (prompt, elicitation, response) always get their own entry
        acc.push({ type: "individual", activity });
      } else {
        // Groupable activities - check if we can add to an existing group
        const lastEntry = acc[acc.length - 1];
        if (lastEntry && lastEntry.type === "group" && Array.isArray(lastEntry.activity)) {
          // Add to existing group
          lastEntry.activity.push(activity);
        } else {
          // Start a new group
          acc.push({ type: "group", activity: [activity] });
        }
      }
      return acc;
    }, []);
  }, [reversedActivities]);

  // callback for loading more activities
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasNextPage || !activeRun?.id) return;
    void fetchNextRunActivities(workspaceSlug, activeRun.id);
  }, [isLoadingMore, hasNextPage, activeRun?.id, fetchNextRunActivities, workspaceSlug]);

  // Set up intersection observer
  useIntersectionObserver(containerRef, isLoadingMore ? null : intersectionElement, handleLoadMore, "100px");

  // latest activity
  const isLatestActivityResponse = useMemo(() => {
    return activities?.[0]?.content.type === "response";
  }, [activities]);
  return (
    <div
      ref={containerRef}
      className={cn("flex flex-col-reverse gap-8 max-h-full h-full w-full mx-auto overflow-y-scroll pt-6 pb-[230px]", {
        "h-fit": !hasNextPage,
      })}
    >
      {/* Messages container - with flex-col-reverse, this appears at bottom and scroll starts here */}
      <div>
        {groupedActivities.map((groupedActivity: TGroupedActivity, index: number) => {
          if (groupedActivity.type === "individual") {
            const activity = groupedActivity.activity as TAgentRunActivity;
            switch (activity.content.type) {
              case "prompt":
                return (
                  <Prompt
                    key={index}
                    message={activity.content.body}
                    id={activity.id}
                    readOnlyEditorRef={readOnlyEditorRef}
                    workspaceId={workspaceId || ""}
                    workspaceSlug={workspaceSlug}
                    projectId={projectId}
                  />
                );
              case "elicitation":
              case "response":
                return (
                  <div className="flex flex-col gap-1" key={index}>
                    <div className="text-body-xs-regular text-secondary">
                      <LiteTextEditor
                        editable={false}
                        ref={readOnlyEditorRef}
                        id={activity.id}
                        initialValue={activity.content.body ?? ""}
                        workspaceId={workspaceId ?? ""}
                        workspaceSlug={workspaceSlug}
                        containerClassName={cn("!py-1 transition-[border-color] duration-500 !px-0")}
                        projectId={projectId?.toString()}
                        displayConfig={{
                          fontSize: "small-font",
                        }}
                        parentClassName="border-none"
                      />
                    </div>
                  </div>
                );
              case "error":
                return (
                  <div className="flex flex-col gap-1" key={index}>
                    <div className="text-body-xs-regular text-error">{activity.content.body}</div>
                  </div>
                );
            }
          }
          return (
            <AgentWork
              key={index}
              activities={groupedActivity.activity as TAgentRunActivity[]}
              isThinking={activeRunStatus === EAgentRunStatus.IN_PROGRESS && !isLatestActivityResponse}
            />
          );
        })}

        {/* Thinking indicator */}
        {activeRunStatus === EAgentRunStatus.IN_PROGRESS && !isLatestActivityResponse && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3 animate-vertical-scale bg-inverse shrink-0" />
            <div className={cn("flex gap-2 items-center text-body-xs-regular truncate")}>
              <span className="shimmer">Working...</span>
            </div>
          </div>
        )}
      </div>
      {/* Loading indicator for pagination - appears at top when scrolling up */}
      {isLoadingMore && <ConversationLoader />}
      {/* Intersection observer element for infinite scroll - triggers when scrolling up */}
      {hasNextPage && <div ref={setIntersectionElement} className="h-1" />}
    </div>
  );
});
