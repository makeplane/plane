import { FC, Fragment, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// components
import { PageForm } from "./";
// hooks
import { useProjectPages, usePage, useEventTracker } from "hooks/store";
// types
import { TPage } from "@plane/types";
// constants
import { PAGE_CREATED, PAGE_UPDATED } from "constants/event-tracker";
import { EPageAccess } from "constants/page";

type TCreateUpdatePageModal = {
  workspaceSlug: string;
  projectId: string;
  isModalOpen: boolean;
  handleModalClose: () => void;
  data?: Partial<TPage> | undefined;
  redirectionEnabled?: boolean;
};

export const CreateUpdatePageModal: FC<TCreateUpdatePageModal> = (props) => {
  const { workspaceSlug, projectId, isModalOpen, handleModalClose, data: pageData, redirectionEnabled = false } = props;
  const router = useRouter();
  // hooks
  const { createPage } = useProjectPages(projectId);
  const { updatePage, asJson: storePageData } = usePage(projectId, pageData?.id || undefined);
  const { capturePageEvent } = useEventTracker();
  // states
  const [pageFormData, setPageFormData] = useState<Partial<TPage>>({
    id: undefined,
    name: "",
    access: EPageAccess.PUBLIC,
  });
  const handlePageFormData = <T extends keyof TPage>(key: T, value: TPage[T]) =>
    setPageFormData((prev) => ({ ...prev, [key]: value }));

  const handleStateClear = () => {
    setPageFormData({ id: undefined, name: "", access: EPageAccess.PUBLIC });
    handleModalClose();
  };

  useEffect(() => {
    if (pageData) {
      setPageFormData({
        id: pageData.id || undefined,
        name: pageData.name || undefined,
        access: pageData.access || undefined,
      });
    }
  }, [pageData]);

  const handleFormSubmit = async () => {
    if (!workspaceSlug || !projectId) return;

    console.log("pageFormData", pageFormData);

    if (pageFormData.id && pageFormData.id != undefined) {
      try {
        if (pageFormData.name === storePageData?.name && pageFormData.access === storePageData?.access) {
          handleStateClear();
          return;
        }
        const pageData = await updatePage(pageFormData);
        if (pageData) {
          capturePageEvent({
            eventName: PAGE_UPDATED,
            payload: {
              ...pageData,
              state: "SUCCESS",
            },
          });
          handleStateClear();
        }
      } catch {
        capturePageEvent({
          eventName: PAGE_UPDATED,
          payload: {
            state: "FAILED",
          },
        });
      }
    } else {
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
