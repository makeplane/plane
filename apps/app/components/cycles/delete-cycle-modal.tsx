import React, { useState } from "react";
// next
import { useRouter } from "next/router";
// swr
import { mutate } from "swr";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import cycleService from "services/cycles.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { DangerButton, SecondaryButton } from "components/ui";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// types
import type { ICycle } from "types";
type TConfirmCycleDeletionProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: ICycle;
};
// fetch-keys
import {
  CYCLE_COMPLETE_LIST,
  CYCLE_CURRENT_LIST,
  CYCLE_DRAFT_LIST,
  CYCLE_LIST,
  CYCLE_UPCOMING_LIST,
} from "constants/fetch-keys";
import { getDateRangeStatus } from "helpers/date-time.helper";

export const DeleteCycleModal: React.FC<TConfirmCycleDeletionProps> = ({
  isOpen,
  setIsOpen,
  data,
}) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    if (!data || !workspaceSlug) return;

    setIsDeleteLoading(true);

    await cycleService
      .deleteCycle(workspaceSlug as string, data.project, data.id)
      .then(() => {
        const cycleType = getDateRangeStatus(data.start_date, data.end_date);
        const fetchKey =
          cycleType === "current"
            ? CYCLE_CURRENT_LIST(projectId as string)
            : cycleType === "upcoming"
            ? CYCLE_UPCOMING_LIST(projectId as string)
            : cycleType === "completed"
            ? CYCLE_COMPLETE_LIST(projectId as string)
            : CYCLE_DRAFT_LIST(projectId as string);

        mutate<ICycle[]>(
          fetchKey,
          (prevData) => {
            if (!prevData) return;

            return prevData.filter((cycle) => cycle.id !== data?.id);
          },
          false
        );

        mutate(
          CYCLE_LIST(projectId as string),
          (prevData: any) => {
            if (!prevData) return;
            return prevData.filter((cycle: any) => cycle.id !== data?.id);
          },
          false
        );
        handleClose();

        setToastAlert({
          title: "Success",
          type: "success",
          message: "Cycle deleted successfully",
        });
      })
      .catch(() => {
        setIsDeleteLoading(false);
      });
  };

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
          <div className="fixed inset-0 bg-brand-backdrop bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-brand-base bg-brand-base text-left shadow-xl transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon
                        className="h-6 w-6 text-red-600"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-brand-base"
                      >
                        Delete Cycle
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-brand-secondary">
                          Are you sure you want to delete cycle-{" "}
                          <span className="break-all font-medium text-brand-base">
                            {data?.name}
                          </span>
                          ? All of the data related to the cycle will be permanently removed. This
                          action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                  <DangerButton onClick={handleDeletion} loading={isDeleteLoading}>
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </DangerButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
