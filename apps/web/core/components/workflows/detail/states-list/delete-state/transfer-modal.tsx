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
import { observer } from "mobx-react";
// plane imports
import { EIconSize } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { AlertIcon, CheckIcon, ChevronDownIcon, StateGroupIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IWorkflow } from "@plane/types";
import { ModalCore } from "@plane/ui";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  stateName: string;
  stateId: string;
  workspaceSlug: string;
  projectId: string;
  workflow: IWorkflow;
};

export const TransferModal = observer(function TransferModal(props: Props) {
  const { isOpen, onClose, stateName, stateId, workspaceSlug, projectId, workflow } = props;
  // state
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // hooks
  const { getStateById, getProjectStateIds } = useProjectState();

  // derived values
  const projectStateIds = getProjectStateIds(projectId);
  const availableStateIds = projectStateIds
    ? projectStateIds.filter((id) => workflow.stateIds.includes(id) && id !== stateId)
    : [];
  const selectedState = selectedStateId ? getStateById(selectedStateId) : null;

  const handleClose = () => {
    setSelectedStateId(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedStateId) return;

    setIsSubmitting(true);
    const destinationStateName = getStateById(selectedStateId)?.name ?? "";

    try {
      await workflow.transferAndDeleteState(workspaceSlug, projectId, stateId, selectedStateId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "State removed successfully",
        message: `Work items relocated to '${destinationStateName}' state.`,
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to remove workflow state. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValueChange = (value: string | string[] | null) => {
    if (typeof value === "string") {
      setSelectedStateId(value);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose}>
      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-start gap-1.5">
          <AlertIcon className="size-4 text-icon-danger-secondary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h5 className="text-h5-medium">Finalize State Removal</h5>
              <p className="text-body-sm-regular text-tertiary">
                To remove <span className="font-medium text-secondary">{stateName}</span>, move all active work items
                following this workflow to a valid destination state within the current workflow.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-body-sm-medium">
                Select destination state<span className="text-danger-primary">*</span>
              </p>
              <Combobox value={selectedStateId ?? undefined} onValueChange={handleValueChange}>
                <Combobox.Button>
                  <Button
                    variant="secondary"
                    size="xl"
                    className="w-full justify-between bg-layer-transparent hover:bg-layer-transparent-hover"
                  >
                    <div className="flex items-center gap-2">
                      {selectedState ? (
                        <>
                          <StateGroupIcon
                            stateGroup={selectedState.group}
                            color={selectedState.color}
                            size={EIconSize.LG}
                            percentage={selectedState.order}
                          />
                          <span className="truncate">{selectedState.name}</span>
                        </>
                      ) : (
                        <span className="text-placeholder">Select state</span>
                      )}
                    </div>
                    <ChevronDownIcon className="size-3.5 shrink-0 text-tertiary" />
                  </Button>
                </Combobox.Button>
                <Combobox.Options
                  showSearch
                  searchPlaceholder="Search state..."
                  emptyMessage="No states available"
                  maxHeight="md"
                  className="rounded-sm border-[0.5px] border-subtle-1 bg-surface-1 px-2 py-2.5 shadow-raised-200 w-full"
                  inputClassName="w-full bg-transparent py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
                  optionsContainerClassName="mt-2 space-y-1"
                  positionerClassName="z-50"
                  dataPreventOutsideClick
                >
                  {availableStateIds.map((id) => {
                    const state = getStateById(id);
                    if (!state) return null;
                    return (
                      <Combobox.Option
                        key={id}
                        value={id}
                        className="w-full truncate flex items-center justify-between gap-2 rounded-sm cursor-pointer select-none px-1 py-1.5 hover:bg-layer-1-hover data-selected:text-primary text-secondary"
                      >
                        <div className="flex items-center gap-2">
                          <StateGroupIcon
                            stateGroup={state.group}
                            color={state.color}
                            size={EIconSize.LG}
                            percentage={state.order}
                          />
                          <span className="truncate text-11">{state.name}</span>
                        </div>
                        {id === selectedStateId && <CheckIcon className="size-3.5 shrink-0" />}
                      </Combobox.Option>
                    );
                  })}
                </Combobox.Options>
              </Combobox>
            </div>
          </div>
        </div>
        <div className="border-t border-subtle" />
        <div className="flex gap-3 justify-end items-center">
          <Button variant="ghost" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button size="lg" onClick={() => void handleSubmit()} disabled={!selectedStateId} loading={isSubmitting}>
            Migrate and remove state
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
