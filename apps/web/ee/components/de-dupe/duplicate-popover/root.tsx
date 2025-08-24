"use client";

import React, { FC, useRef, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { TDeDupeIssue } from "@plane/types";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { MultipleSelectGroup } from "@/components/core/multiple-select";
import type { TIssueOperations } from "@/components/issues/issue-detail";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMultipleSelectStore } from "@/hooks/store/use-multiple-select-store";
// plane web imports
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { DE_DUPE_SELECT_GROUP } from "@/plane-web/constants/de-dupe";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
// local imports
import { DeDupeIssueButtonLabel } from "../issue-block/button-label";
import { DeDupeIssueBlockRoot } from "./block-root";

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

export const DeDupeIssuePopoverRoot: FC<TDeDupeIssuePopoverRootProps> = observer((props) => {
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

  if (!workspaceSlug || !projectId || !rootIssueId || !isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED))
    return <></>;
  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PI_DEDUPE" fallback={<></>}>
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
                className={cn("mt-2 bg-custom-background-100 rounded-lg shadow-xl overflow-hidden")}
              >
                <div
                  ref={containerRef}
                  className="relative flex flex-col gap-2.5 h-full px-3 py-4 rounded-lg shadow-xl bg-pi-50 max-h-[460px]"
                >
                  <div className="flex gap-1.5 w-80 flex-shrink-0">
                    <p className="text-left text-xs text-custom-text-200">
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
                        variant="neutral-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose();
                        }}
                      >
                        Discard
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
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
    </WithFeatureFlagHOC>
  );
});
