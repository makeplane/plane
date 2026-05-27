/* eslint-disable */
/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Loader } from "lucide-react";
import { CloseIcon, StateGroupIcon } from "@plane/propel/icons";
// plane imports
import { EIconSize } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { IState, TStateOperationsCallbacks } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TStateDelete = {
  totalStates: number;
  state: IState;
  deleteStateCallback: TStateOperationsCallbacks["deleteState"];
  shouldTrackEvents?: boolean;
};

export const StateDelete = observer(function StateDelete(props: TStateDelete) {
  const { totalStates, state, deleteStateCallback } = props;
  // hooks
  const { isMobile } = usePlatformOS();
  const { getProjectStates } = useProjectState();
  // states
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [needsReplacement, setNeedsReplacement] = useState(false);
  const [issueCount, setIssueCount] = useState(0);
  const [replacementStateId, setReplacementStateId] = useState<string>("");
  // derived values
  const isDeleteDisabled = state.default ? true : totalStates === 1 ? true : false;
  const projectStates = getProjectStates(state.project_id);
  const availableReplacements = projectStates?.filter((s) => s.id !== state.id) ?? [];

  const handleDeleteState = async () => {
    if (isDeleteDisabled) return;

    setIsDelete(true);

    try {
      await deleteStateCallback(state.id, needsReplacement ? replacementStateId : undefined);
      setIsDelete(false);
      handleClose();
    } catch (error) {
      const errorResponse = error as { status: number; data: { error: string; issue_count?: number } };
      if (errorResponse.status === 400 && errorResponse.data?.issue_count) {
        // Backend returned issue_count — show replacement UI
        setIssueCount(errorResponse.data.issue_count);
        setNeedsReplacement(true);
        setIsDelete(false);
      } else if (errorResponse.status === 400) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorResponse.data?.error || "State could not be deleted. Please try again.",
        });
        setIsDelete(false);
      } else {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "State could not be deleted. Please try again.",
        });
        setIsDelete(false);
      }
    }
  };

  const handleClose = () => {
    setIsDeleteModal(false);
    setNeedsReplacement(false);
    setReplacementStateId("");
    setIssueCount(0);
  };

  return (
    <>
      <AlertModalCore
        handleClose={handleClose}
        handleSubmit={handleDeleteState}
        isSubmitting={isDelete}
        isOpen={isDeleteModal}
        title={needsReplacement ? "Replace and Delete State" : "Delete State"}
        primaryButtonText={needsReplacement ? "Move Issues & Delete" : undefined}
        content={
          needsReplacement ? (
            <div className="space-y-3">
              <p>
                <span className="font-medium text-primary">{issueCount}</span> issues are in this state. Choose a
                replacement state before deleting.
              </p>
              <div className="space-y-1.5">
                <label className="text-body-xs-medium text-secondary">Replacement State</label>
                <select
                  className="focus:ring-accent-primary w-full rounded-md border border-subtle bg-surface-1 px-3 py-2 text-body-sm-regular text-primary focus:ring-1 focus:outline-none"
                  value={replacementStateId}
                  onChange={(e) => setReplacementStateId(e.target.value)}
                >
                  <option value="">Select a replacement state...</option>
                  {availableReplacements.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.group})
                    </option>
                  ))}
                </select>
              </div>
              {!replacementStateId && (
                <p className="text-body-xs-regular text-danger-primary">
                  Please select a replacement state to proceed.
                </p>
              )}
            </div>
          ) : (
            <>
              Are you sure you want to delete state- <span className="font-medium text-primary">{state?.name}</span>?
              All of the data related to the state will be permanently removed. This action cannot be undone.
            </>
          )
        }
      />

      <button
        type="button"
        className={cn(
          "flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-sm transition-colors focus:outline-none",
          isDeleteDisabled ? "bg-surface-2 text-secondary" : "text-danger-primary hover:bg-layer-1"
        )}
        disabled={isDeleteDisabled}
        onClick={() => setIsDeleteModal(true)}
      >
        <Tooltip
          tooltipContent={
            state.default ? "Cannot delete the default state." : totalStates === 1 ? `Cannot have an empty group.` : ``
          }
          isMobile={isMobile}
          disabled={!isDeleteDisabled}
          className="focus:outline-none"
        >
          {isDelete ? <Loader className="h-3.5 w-3.5 text-secondary" /> : <CloseIcon className="h-3.5 w-3.5" />}
        </Tooltip>
      </button>
    </>
  );
});
