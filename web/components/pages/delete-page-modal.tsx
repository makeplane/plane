import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import { PageService } from "services/page.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button } from "@plane/ui";
// icons
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
// types
import type { IUser, IPage } from "types";
// fetch-keys
import { ALL_PAGES_LIST, FAVORITE_PAGES_LIST, MY_PAGES_LIST, RECENT_PAGES_LIST } from "constants/fetch-keys";

type TConfirmPageDeletionProps = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data?: IPage | null;
  user: IUser | undefined;
};

// services
const pageService = new PageService();

export const DeletePageModal: React.FC<TConfirmPageDeletionProps> = ({ isOpen, setIsOpen, data, user }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleClose = () => {
    setIsOpen(false);
    setIsDeleteLoading(false);
  };

  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    if (!data || !workspaceSlug || !projectId) return;

    await pageService
      .deletePage(workspaceSlug as string, data.project, data.id, user)
      .then(() => {
        mutate(RECENT_PAGES_LIST(projectId as string));
        mutate<IPage[]>(
          MY_PAGES_LIST(projectId as string),
          (prevData) => (prevData ?? []).filter((page) => page.id !== data?.id),
          false
        );
        mutate<IPage[]>(
          ALL_PAGES_LIST(projectId as string),
          (prevData) => (prevData ?? []).filter((page) => page.id !== data?.id),
          false
        );
        mutate<IPage[]>(
          FAVORITE_PAGES_LIST(projectId as string),
          (prevData) => (prevData ?? []).filter((page) => page.id !== data?.id),
          false
        );
        handleClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page deleted successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      })
      .finally(() => {
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
          <div className="fixed inset-0 bg-custom-backdrop bg-opacity-50 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-[40rem]">
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                        Delete Page
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-custom-text-200">
                          Are you sure you want to delete Page-{" "}
                          <span className="break-words font-medium text-custom-text-100">{data?.name}</span>? All of the
                          data related to the page will be permanently removed. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-4 sm:px-6">
                  <Button variant="neutral-primary" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleDeletion} loading={isDeleteLoading}>
                    {isDeleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
