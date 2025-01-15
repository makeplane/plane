"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AlertCircle, Search, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// hooks
// ui
//icons
import { EIssuesStoreType } from "@plane/constants";
import { ContrastIcon, TransferIcon, TOAST_TYPE, setToast } from "@plane/ui";
import { useCycle, useIssues } from "@/hooks/store";
//icons
// constants

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
};

export const TransferIssuesModal: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose, cycleId } = props;
  // states
  const [query, setQuery] = useState("");

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
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Issues have been transferred successfully",
        });
        await getCycleDetails(payload.new_cycle_id);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Unable to transfer Issues. Please try again.",
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
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: error.error || "Unable to fetch cycle details",
      });
    });
  };

  const filteredOptions = currentProjectIncompleteCycleIds?.filter((optionId) => {
    const cycleDetails = getCycleById(optionId);

    return cycleDetails?.name?.toLowerCase().includes(query?.toLowerCase());
  });

  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === "Escape") {
  //       handleClose();
  //     }
  //   };
  // }, [handleClose]);

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10">
          <div className="mt-10 flex min-h-full items-start justify-center p-4 text-center sm:p-0 md:mt-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 py-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-5">
                    <div className="flex items-center gap-1">
                      <TransferIcon className="w-5 fill-custom-text-100" />
                      <h4 className="text-xl font-medium text-custom-text-100">Transfer Issues</h4>
                    </div>
                    <button onClick={handleClose}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-b border-custom-border-200 px-5 pb-3">
                    <Search className="h-4 w-4 text-custom-text-200" />
                    <input
                      className="outline-none text-sm"
                      placeholder="Search for a cycle..."
                      onChange={(e) => setQuery(e.target.value)}
                      value={query}
                    />
                  </div>
                  <div className="flex w-full flex-col items-start gap-2 px-5">
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((optionId) => {
                          const cycleDetails = getCycleById(optionId);

                          if (!cycleDetails) return;

                          return (
                            <button
                              key={optionId}
                              className="flex w-full items-center gap-4 rounded px-4 py-3 text-sm text-custom-text-200 hover:bg-custom-background-90"
                              onClick={() => {
                                transferIssue({
                                  new_cycle_id: optionId,
                                });
                                handleClose();
                              }}
                            >
                              <ContrastIcon className="h-5 w-5" />
                              <div className="flex w-full justify-between">
                                <span>{cycleDetails?.name}</span>
                                {cycleDetails.status && (
                                  <span className=" flex items-center rounded-full bg-custom-background-80  px-2 capitalize">
                                    {cycleDetails.status.toLocaleLowerCase()}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex w-full items-center justify-center gap-4 p-5 text-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-custom-text-200" />
                          <span className="text-center text-custom-text-200">
                            You don’t have any current cycle. Please create one to transfer the issues.
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-center text-custom-text-200">Loading...</p>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
