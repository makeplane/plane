/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CloseOutline, CyclesOutline, SearchOutline, WarningCircleOutline } from "@makeplane/propel/icons";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseGroup,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { useTranslation } from "@plane/i18n";
import { setToast } from "@plane/blocks/toast";
import { EIssuesStoreType } from "@plane/types";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
};

export const TransferIssuesModal = observer(function TransferIssuesModal(props: Props) {
  const { isOpen, handleClose, cycleId } = props;
  // states
  const [query, setQuery] = useState("");
  // plane hooks
  const { t } = useTranslation();

  // store hooks
  const { currentProjectIncompleteCycleIds, getCycleById, fetchActiveCycleProgress } = useCycle();
  const {
    issues: { transferIssuesFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const { workspaceSlug, projectId } = useParams();

  const transferIssue = async (payload: { new_cycle_id: string }) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    await transferIssuesFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), payload)
      .then(async () => {
        setToast({
          type: "success",
          title: "Success!",
          message: "Work items have been transferred successfully",
        });
        await getCycleDetails(payload.new_cycle_id);
      })
      .catch(() => {
        setToast({
          type: "error",
          title: "Error!",
          message: "Unable to transfer work items. Please try again.",
        });
      });
  };

  /**To update issue counts in target cycle and current cycle */
  const getCycleDetails = async (newCycleId: string) => {
    const cyclesFetch = [
      fetchActiveCycleProgress(workspaceSlug.toString(), projectId.toString(), cycleId),
      fetchActiveCycleProgress(workspaceSlug.toString(), projectId.toString(), newCycleId),
    ];
    await Promise.all(cyclesFetch).catch((error) => {
      setToast({
        type: "error",
        title: "Error",
        message: error.error || "Unable to fetch cycle details",
      });
    });
  };

  const filteredOptions = currentProjectIncompleteCycleIds?.filter((optionId) => {
    const cycleDetails = getCycleById(optionId);

    return cycleDetails?.name?.toLowerCase().includes(query?.toLowerCase());
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="sm">
        <DialogCloseGroup>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label={t("close")}
            icon={<CloseOutline />}
            render={<DialogClose />}
          />
        </DialogCloseGroup>
        <DialogMain>
          <DialogHeader>
            <DialogHeading>
              <DialogTitle>Transfer work items</DialogTitle>
            </DialogHeading>
          </DialogHeader>
          <div className="flex items-center gap-2 border-b border-subtle pb-3">
            <SearchOutline className="size-4 shrink-0 text-placeholder" />
            <input
              className="w-full bg-transparent text-body-xs-regular outline-none placeholder:text-placeholder"
              placeholder="Search for a cycle..."
              onChange={(e) => setQuery(e.target.value)}
              value={query}
            />
          </div>
          <DialogBody tabIndex={0}>
            <div className="flex w-full flex-col items-start gap-0.5">
              {filteredOptions ? (
                filteredOptions.length > 0 ? (
                  filteredOptions.map((optionId) => {
                    const cycleDetails = getCycleById(optionId);

                    if (!cycleDetails) return;

                    return (
                      <button
                        key={optionId}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-body-xs-regular text-secondary hover:bg-layer-transparent-hover"
                        onClick={() => {
                          transferIssue({
                            new_cycle_id: optionId,
                          });
                          handleClose();
                        }}
                      >
                        <CyclesOutline className="size-4 shrink-0 text-tertiary" />
                        <div className="flex w-full items-center justify-between gap-2 truncate">
                          <span className="truncate">{cycleDetails?.name}</span>
                          {cycleDetails.status && (
                            <span className="flex shrink-0 items-center rounded-sm bg-layer-1 px-1.5 text-caption-sm-regular text-tertiary capitalize">
                              {cycleDetails.status.toLocaleLowerCase()}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex w-full items-center justify-center gap-2 p-5 text-body-xs-regular">
                    <WarningCircleOutline className="size-4 shrink-0 text-secondary" />
                    <span className="text-center text-secondary">
                      You don’t have any current cycle. Please create one to transfer the work items.
                    </span>
                  </div>
                )
              ) : (
                <p className="text-center text-secondary">Loading...</p>
              )}
            </div>
          </DialogBody>
        </DialogMain>
      </DialogContent>
    </Dialog>
  );
});
