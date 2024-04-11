import { FC, Fragment, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// types
import { TPage } from "@plane/types";
// components
import { PageForm } from "@/components/pages";
// constants
import { PAGE_CREATED } from "@/constants/event-tracker";
import { EPageAccess } from "@/constants/page";
// hooks
import { useProjectPages, useEventTracker } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isModalOpen: boolean;
  handleModalClose: () => void;
  redirectionEnabled?: boolean;
};

export const CreatePageModal: FC<Props> = (props) => {
  const { workspaceSlug, projectId, isModalOpen, handleModalClose, redirectionEnabled = false } = props;
  // states
  const [pageFormData, setPageFormData] = useState<Partial<TPage>>({
    id: undefined,
    name: "",
    access: EPageAccess.PUBLIC,
  });
  // router
  const router = useRouter();
  // store hooks
  const { createPage } = useProjectPages(projectId);
  const { capturePageEvent } = useEventTracker();
  const handlePageFormData = <T extends keyof TPage>(key: T, value: TPage[T]) =>
    setPageFormData((prev) => ({ ...prev, [key]: value }));

  const handleStateClear = () => {
    setPageFormData({ id: undefined, name: "", access: EPageAccess.PUBLIC });
    handleModalClose();
  };

  const handleFormSubmit = async () => {
    if (!workspaceSlug || !projectId) return;

    try {
      const pageData = await createPage(pageFormData);
      if (pageData) {
        capturePageEvent({
          eventName: PAGE_CREATED,
          payload: {
            ...pageData,
            state: "SUCCESS",
          },
        });
        handleStateClear();
        if (redirectionEnabled) router.push(`/${workspaceSlug}/projects/${projectId}/pages/${pageData.id}`);
      }
    } catch {
      capturePageEvent({
        eventName: PAGE_CREATED,
        payload: {
          state: "FAILED",
        },
      });
    }
  };

  return (
    <Transition.Root show={isModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleModalClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="my-10 flex justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 px-4 text-left shadow-custom-shadow-md transition-all w-full sm:max-w-2xl">
                <PageForm
                  formData={pageFormData}
                  handleFormData={handlePageFormData}
                  handleModalClose={handleStateClear}
                  handleFormSubmit={handleFormSubmit}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
