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

import React, { useRef, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { useSWRConfig } from "swr";
import { Popover } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TDeDupeIssue } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { MultipleSelectGroup } from "@/components/core/multiple-select";
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
// plane web imports
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { DE_DUPE_SELECT_GROUP } from "@/constants/de-dupe";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// services
import { PIService } from "@/services/pi.service";
// local imports
import { DeDupeIssueButtonLabel } from "../issue-block/button-label";
import { DeDupeIssueBlockRoot } from "./block-root";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";

const piService = new PIService();

type TDeDupeIssuePopoverRootProps = {
  workspaceSlug: string;
  projectId: string;
  rootIssueId: string;
  issues: TDeDupeIssue[];
  issueOperations: TIssueOperations;
  disabled?: boolean;
  renderDeDupeActionModals?: boolean;
  isIntakeIssue?: boolean;
};

export const DeDupeIssuePopoverRoot = observer(function DeDupeIssuePopoverRoot(props: TDeDupeIssuePopoverRootProps) {
  const {
    workspaceSlug,
    projectId,
    rootIssueId,
    issues,
    issueOperations,
    disabled = false,
    renderDeDupeActionModals = true,
    isIntakeIssue = false,
  } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  // store
  const { isArchiveIssueModalOpen, isDeleteIssueModalOpen, createRelation } = useIssueDetail();
  const { selectedEntityIds, clearSelection } = useMultipleSelectStore();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { mutate } = useSWRConfig();
  // popper
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 20,
        },
      },
    ],
  });

  const handleClose = () => {
    setIsOpen(false);
    clearSelection();
  };

  const handleDiscard = useCallback(async () => {
    if (selectedEntityIds.length === 0) {
      handleClose();
      return;
    }

    try {
      await piService.postDuplicateFeedback({
        issue_id: rootIssueId,
        not_duplicates_with: selectedEntityIds,
      });
      // Invalidate all SWR keys matching this workspace+project duplicate query
      mutate((key: string) => typeof key === "string" && key.startsWith("DUPLICATE_ISSUE_"), undefined, {
        revalidate: true,
      });
    } catch (error) {
      console.error("Failed to submit duplicate feedback", error);
    }
    handleClose();
  }, [rootIssueId, selectedEntityIds, mutate, handleClose]);

  const handleMarkAsDuplicate = async (workspaceSlug: string, projectId: string, issueId: string, data: string[]) => {
    if (data.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one work item.",
      });
      return;
    }

    await createRelation(workspaceSlug, projectId, issueId, "duplicate", data);

    handleClose();
  };

  useOutsideClickDetector(containerRef, () => {
    if (isOpen && !isArchiveIssueModalOpen && !isDeleteIssueModalOpen) {
      handleClose();
    }
  });

  const deDupeIds = issues.map((issue) => issue.id);

  if (
    !workspaceSlug ||
    !projectId ||
    !rootIssueId ||
    !isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED)
  )
    return <></>;
  return (
    <WithAiFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="AI_DEDUPE">
      <Popover as="div" className={cn("relative")}>
        <>
          <Popover.Button as={React.Fragment}>
            <button
              type="button"
              ref={setReferenceElement}
              className={cn("outline-none")}
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
            >
              <DeDupeIssueButtonLabel isOpen={isOpen} buttonLabel="Potential duplicates found!" />
            </button>
          </Popover.Button>
          {isOpen && (
            <Popover.Panel className="fixed z-10" static>
              <div
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
                className={cn("mt-2 bg-surface-1 rounded-lg shadow-xl overflow-hidden")}
              >
                <div
                  ref={containerRef}
                  className="relative flex flex-col gap-2.5 h-full px-3 py-4 rounded-lg shadow-xl bg-layer-1 max-h-[460px]"
                >
                  <div className="flex gap-1.5 w-80 flex-shrink-0">
                    <p className="text-left text-11 text-secondary">
                      {`Hey, ${issues?.length} work item${issues?.length > 1 ? "s" : ""} listed below seem${issues?.length > 1 ? "" : "s"} to be duplicate of this work item. Select if only some of them are helpful.`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 overflow-hidden overflow-y-auto flex-grow pb-1 w-80">
                    <MultipleSelectGroup
                      containerRef={containerRef}
                      entities={{
                        [DE_DUPE_SELECT_GROUP]: deDupeIds,
                      }}
                    >
                      {(helpers) => (
                        <>
                          {issues.map((issue: TDeDupeIssue) => (
                            <DeDupeIssueBlockRoot
                              key={issue.id}
                              workspaceSlug={workspaceSlug}
                              issue={issue}
                              selectionHelpers={helpers}
                              issueOperations={issueOperations}
                              renderDeDupeActionModals={renderDeDupeActionModals}
                              isIntakeIssue={isIntakeIssue}
                            />
                          ))}
                        </>
                      )}
                    </MultipleSelectGroup>
                  </div>
                  {!isIntakeIssue && (
                    <div className="flex items-center gap-2 justify-end flex-shrink-0">
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDiscard();
                        }}
                      >
                        Discard
                      </Button>
                      <Button
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsDuplicate(workspaceSlug, projectId, rootIssueId, selectedEntityIds);
                        }}
                      >
                        Mark as duplicate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Popover.Panel>
          )}
        </>
      </Popover>
    </WithAiFeatureFlagHOC>
  );
});
