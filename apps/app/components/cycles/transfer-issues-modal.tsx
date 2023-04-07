import React, { useState, useEffect } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// component
import { Dialog, Transition } from "@headlessui/react";
// services
import cyclesService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
//icons
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ContrastIcon, CyclesIcon, ExclamationIcon, TransferIcon } from "components/icons";
// fetch-key
import { CYCLE_INCOMPLETE_LIST, CYCLE_ISSUES_WITH_PARAMS } from "constants/fetch-keys";
// types
import { ICycle } from "types";
//helper
import { getDateRangeStatus } from "helpers/date-time.helper";
import useIssuesView from "hooks/use-issues-view";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
};

export const TransferIssuesModal: React.FC<Props> = ({ isOpen, handleClose }) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { params } = useIssuesView();

  const { setToastAlert } = useToast();

  const transferIssue = async (payload: any) => {
    await cyclesService
      .transferIssues(workspaceSlug as string, projectId as string, cycleId as string, payload)
      .then((res) => {
        mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
        setToastAlert({
          type: "success",
          title: "Issues transfered successfully",
          message: "Issues have been transferred successfully",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Issues cannot be transfer. Please try again.",
        });
      });
  };

  const { data: incompleteCycles } = useSWR(
    workspaceSlug && projectId ? CYCLE_INCOMPLETE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => cyclesService.getIncompleteCycles(workspaceSlug as string, projectId as string)
      : null
  );

  const filteredOptions =
    query === ""
      ? incompleteCycles
      : incompleteCycles?.filter((option) =>
          option.name.toLowerCase().includes(query.toLowerCase())
        );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
  }, [handleClose]);
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
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
              <Dialog.Panel className="relative transform rounded-lg bg-white py-5 text-left shadow-xl transition-all sm:w-full sm:max-w-2xl">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-5">
                    <div className="flex items-center gap-2">
                      <TransferIcon className="h-4 w-5" color="#495057" />
                      <h4 className="text-gray-700 font-medium text-[1.50rem]">Transfer Issues</h4>
                    </div>
                    <button onClick={handleClose}>
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pb-3 mt-2 px-5 border-b border-gray-200">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />
                    <input
                      className="outline-none"
                      placeholder="Search for a cycle..."
                      onChange={(e) => setQuery(e.target.value)}
                      value={query}
                    />
                  </div>
                  <div className="flex flex-col items-start w-full gap-2 px-5">
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((option: ICycle) => (
                          <button
                            key={option.id}
                            className="flex items-center gap-4 py-3 px-2 text-gray-600 text-sm rounded w-full hover:bg-gray-100"
                            onClick={() => {
                              transferIssue({
                                new_cycle_id: option?.id,
                              });
                              handleClose();
                            }}
                          >
                            <ContrastIcon className="h-5 w-5" />
                            <div className="flex justify-between w-full">
                              <span>{option?.name}</span>
                              <span className=" flex bg-gray-200 capitalize px-2 rounded-full items-center">
                                {getDateRangeStatus(option?.start_date, option?.end_date)}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="flex items-center justify-center gap-4 p-5 text-sm w-full">
                          <ExclamationIcon height={14} width={14} />
                          <span className="text-center text-gray-500">
                            You don’t have any current cycle. Please create one to transfer the
                            issues.
                          </span>
                        </div>
                      )
                    ) : (
                      <p className="text-center text-gray-500">Loading...</p>
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
};
