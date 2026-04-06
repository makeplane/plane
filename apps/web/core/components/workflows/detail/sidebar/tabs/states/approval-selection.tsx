/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useProjectState } from "@/hooks/store/use-project-state";
import { TransitionStatesList } from "./states-list";
import { SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/propel/input";
import { Button } from "@plane/propel/button";
import { countGroupedStates, filterGroupedStates } from "@plane/utils";
import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import type { IState } from "@plane/types";

type Props = {
  availableStateIds: string[];
  selectedApproveStateId?: string;
  selectedRejectStateId?: string;
  onApproveChange: (stateId: string) => void;
  onRejectChange: (stateId: string) => void;
  currentStateId: string;
};

const STATES_DISPLAY_THRESHOLD = 4;

export const ApprovalStateSelection = observer(function ApprovalStateSelection(props: Props) {
  const {
    availableStateIds,
    selectedApproveStateId,
    selectedRejectStateId,
    onApproveChange,
    onRejectChange,
    currentStateId,
  } = props;
  // states
  const [approveSearchQuery, setApproveSearchQuery] = useState("");
  const [rejectSearchQuery, setRejectSearchQuery] = useState("");
  const [isApproveExpanded, setIsApproveExpanded] = useState(false);
  const [isRejectExpanded, setIsRejectExpanded] = useState(false);
  // hooks
  const { groupedProjectStates } = useProjectState();
  const hasGroupedProjectStates = !!groupedProjectStates;

  const approvalExistingStateIds = [currentStateId, selectedRejectStateId].filter((id) => id !== undefined);
  const rejectExistingStateIds = [currentStateId, selectedApproveStateId].filter((id) => id !== undefined);

  // Filter and group approval states
  const groupedApprovalStates = useMemo(() => {
    return filterGroupedStates({
      groupedStates: groupedProjectStates,
      includedStateIds: availableStateIds,
      searchQuery: approveSearchQuery,
    });
  }, [availableStateIds, groupedProjectStates, approveSearchQuery]);

  // Filter and group rejection states
  const groupedRejectionStates = useMemo(() => {
    return filterGroupedStates({
      groupedStates: groupedProjectStates,
      includedStateIds: availableStateIds,
      searchQuery: rejectSearchQuery,
    });
  }, [availableStateIds, groupedProjectStates, rejectSearchQuery]);

  // Flatten approval states for counting
  const allApprovalStates = useMemo(() => {
    return Object.values(groupedApprovalStates).flat();
  }, [groupedApprovalStates]);

  // Flatten rejection states for counting
  const allRejectionStates = useMemo(() => {
    return Object.values(groupedRejectionStates).flat();
  }, [groupedRejectionStates]);

  const shouldShowMoreApproval = allApprovalStates.length > STATES_DISPLAY_THRESHOLD;
  const shouldShowMoreRejection = allRejectionStates.length > STATES_DISPLAY_THRESHOLD;

  // Get displayed approval states (limited by threshold if not expanded)
  const displayedApprovalStates = useMemo(() => {
    if (!shouldShowMoreApproval || isApproveExpanded) {
      return groupedApprovalStates;
    }

    const limited: Record<string, IState[]> = {};
    let displayedCount = 0;

    for (const [groupKey, groupStates] of Object.entries(groupedApprovalStates)) {
      if (displayedCount >= STATES_DISPLAY_THRESHOLD) break;

      const remaining = STATES_DISPLAY_THRESHOLD - displayedCount;
      if (groupStates.length <= remaining) {
        limited[groupKey] = groupStates;
        displayedCount += groupStates.length;
      } else {
        limited[groupKey] = groupStates.slice(0, remaining);
        displayedCount += remaining;
      }
    }

    return limited;
  }, [groupedApprovalStates, shouldShowMoreApproval, isApproveExpanded]);

  // Get displayed rejection states (limited by threshold if not expanded)
  const displayedRejectionStates = useMemo(() => {
    if (!shouldShowMoreRejection || isRejectExpanded) {
      return groupedRejectionStates;
    }

    const limited: Record<string, IState[]> = {};
    let displayedCount = 0;

    for (const [groupKey, groupStates] of Object.entries(groupedRejectionStates)) {
      if (displayedCount >= STATES_DISPLAY_THRESHOLD) break;

      const remaining = STATES_DISPLAY_THRESHOLD - displayedCount;
      if (groupStates.length <= remaining) {
        limited[groupKey] = groupStates;
        displayedCount += groupStates.length;
      } else {
        limited[groupKey] = groupStates.slice(0, remaining);
        displayedCount += remaining;
      }
    }

    return limited;
  }, [groupedRejectionStates, shouldShowMoreRejection, isRejectExpanded]);

  // Calculate displayed count for approval section
  const displayedApprovalCount = useMemo(() => {
    return Object.values(displayedApprovalStates).reduce((sum, states) => sum + states.length, 0);
  }, [displayedApprovalStates]);

  // Calculate displayed count for rejection section
  const displayedRejectionCount = useMemo(() => {
    return Object.values(displayedRejectionStates).reduce((sum, states) => sum + states.length, 0);
  }, [displayedRejectionStates]);

  const hasApprovalStates = countGroupedStates(groupedApprovalStates) > 0;
  const hasRejectionStates = countGroupedStates(groupedRejectionStates) > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 inline-block rounded-full bg-success-primary" />{" "}
          <span className="text-body-sm-medium">on approve, move to</span>
        </div>
        <Input
          placeholder="Search states"
          inputSize="xs"
          value={approveSearchQuery}
          onChange={(e) => setApproveSearchQuery(e.target.value.toLowerCase())}
          prependIcon={<SearchIcon />}
        />
        <div className="flex flex-col">
          {hasGroupedProjectStates && hasApprovalStates ? (
            Object.entries(displayedApprovalStates).map(([groupKey, groupStates]) => (
              <div key={`approve-${groupKey}`}>
                <h6 className="text-caption-md-regular capitalize text-tertiary py-1.5 px-2">{groupKey}</h6>
                <TransitionStatesList
                  states={groupStates}
                  selectedStates={selectedApproveStateId ? [selectedApproveStateId] : []}
                  onChange={onApproveChange}
                  disabledStateIds={approvalExistingStateIds}
                />
              </div>
            ))
          ) : hasGroupedProjectStates ? (
            <p className="px-2 py-1.5 text-caption-md-regular text-placeholder">
              {approveSearchQuery.length > 0 ? "No matching results" : "No states available"}
            </p>
          ) : null}
        </div>
        {shouldShowMoreApproval && (
          <Button
            onClick={() => setIsApproveExpanded(!isApproveExpanded)}
            variant="link"
            className="justify-start no-underline"
          >
            {isApproveExpanded ? "Show less" : `Show more (${allApprovalStates.length - displayedApprovalCount})`}
          </Button>
        )}
      </div>
      <span className="border-t border-subtle" />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 inline-block rounded-full bg-danger-primary" />{" "}
          <span className="text-body-sm-medium">on reject, move to</span>
        </div>
        <Input
          placeholder="Search states"
          inputSize="xs"
          value={rejectSearchQuery}
          onChange={(e) => setRejectSearchQuery(e.target.value.toLowerCase())}
          prependIcon={<SearchIcon />}
        />
        <div className="flex flex-col">
          {hasGroupedProjectStates && hasRejectionStates ? (
            Object.entries(displayedRejectionStates).map(([groupKey, groupStates]) => (
              <div key={`reject-${groupKey}`}>
                <h6 className="text-caption-md-regular capitalize text-tertiary py-1.5 px-2">{groupKey}</h6>
                <TransitionStatesList
                  states={groupStates}
                  selectedStates={selectedRejectStateId ? [selectedRejectStateId] : []}
                  onChange={onRejectChange}
                  disabledStateIds={rejectExistingStateIds}
                />
              </div>
            ))
          ) : hasGroupedProjectStates ? (
            <p className="px-2 py-1.5 text-caption-md-regular text-placeholder">
              {rejectSearchQuery.length > 0 ? "No matching results" : "No states available"}
            </p>
          ) : null}
        </div>
        {shouldShowMoreRejection && (
          <Button
            onClick={() => setIsRejectExpanded(!isRejectExpanded)}
            variant="link"
            className="justify-start no-underline"
          >
            {isRejectExpanded ? "Show less" : `Show more (${allRejectionStates.length - displayedRejectionCount})`}
          </Button>
        )}
      </div>
    </div>
  );
});
