import React, { useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// hooks
import useToast from "hooks/use-toast";
import { useCycle, useIssues } from "hooks/store";
//icons
import { ContrastIcon, TransferIcon } from "@plane/ui";
import { AlertCircle, Search, X } from "lucide-react";
// constants
import { EIssuesStoreType } from "constants/issue";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

export const TransferIssuesModal: React.FC<Props> = observer((props) => {
  const { isOpen, handleClose } = props;
  // states
  const [query, setQuery] = useState("");

  // store hooks
  const { currentProjectIncompleteCycleIds, getCycleById } = useCycle();
  const {
    issues: { transferIssuesFromCycle },
  } = useIssues(EIssuesStoreType.CYCLE);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { setToastAlert } = useToast();

  const transferIssue = async (payload: any) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    // TODO: import transferIssuesFromCycle from store
    await transferIssuesFromCycle(workspaceSlug.toString(), projectId.toString(), cycleId.toString(), payload)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Issues transferred successfully",
          message: "Issues have been transferred successfully",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issues cannot be transfer. Please try again.",
        });
      });
  };

  const filteredOptions = currentProjectIncompleteCycleIds?.filter((optionId) => {
    const cycleDetails = getCycleById(optionId);

    return cycleDetails?.name.toLowerCase().includes(query.toLowerCase());
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
              <Dialog.Panel className="relative transform rounded-lg bg-neutral-component-surface-light py-5 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-5">
                    <div className="flex items-center gap-3">
                      <TransferIcon className="h-4 w-4" color="#495057" />
                      <h4 className="text-xl font-medium text-neutral-text-strong">Transfer Issues</h4>
                    </div>
                    <button onClick={handleClose}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 border-b border-neutral-border-medium px-5 pb-3">
                    <Search className="h-4 w-4 text-neutral-text-medium" />
                    <input
                      className="bg-neutral-component-surface-medium outline-none"
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
                              className="flex w-full items-center gap-4 rounded px-4 py-3 text-sm text-neutral-text-medium hover:bg-neutral-component-surface-medium"
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
                                <span className=" flex items-center rounded-full bg-neutral-component-surface-dark  px-2 capitalize">
                                  {cycleDetails.status.toLocaleLowerCase()}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="flex w-full items-center justify-center gap-4 p-5 text-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-neutral-text-medium" />
                          <span className="text-center text-neutral-text-medium">
                            You don’t have any current cycle. Please create one to transfer the issues.
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-center text-neutral-text-medium">Loading...</p>
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
