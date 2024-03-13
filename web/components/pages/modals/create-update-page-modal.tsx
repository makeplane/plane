import React, { FC, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// components
import { PageForm } from "./";
import { PAGE_CREATED, PAGE_UPDATED } from "constants/event-tracker";
import { useEventTracker } from "hooks/store";
// hooks
// import { IPageStore } from "store/pages/page.store";
// import { usePage } from "hooks/store/";
// types
import { TPage } from "@plane/types";

type TCreateUpdatePageModal = {
  workspaceSlug: string;
  projectId: string;
  isModalOpen: boolean;
  handleModalClose: () => void;
  data?: Partial<TPage> | undefined;
};

export const CreateUpdatePageModal: FC<TCreateUpdatePageModal> = (props) => {
  const { workspaceSlug, projectId, isModalOpen, handleModalClose, data: pageData } = props;
  // hooks
  // states
  const [pageFormData, setPageFormData] = useState<Partial<TPage>>({ name: "" });
  const handlePageFormData = <T extends keyof TPage>(key: T, value: TPage[T]) =>
    setPageFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (pageData) {
      setPageFormData({
        id: pageData.id || undefined,
        name: pageData.name || undefined,
        access: pageData.access || undefined,
      });
    }
  }, [pageData]);

  // store hooks
  // const { createPage } = useProjectPages();
  // const { capturePageEvent } = useEventTracker();

  const createProjectPage = async (payload: any) => {
    if (!workspaceSlug) return;
    // await createPage(workspaceSlug.toString(), projectId, payload)
    //   .then((res) => {
    //     capturePageEvent({
    //       eventName: PAGE_CREATED,
    //       payload: {
    //         ...res,
    //         state: "SUCCESS",
    //       },
    //     });
    //   })
    //   .catch(() => {
    //     capturePageEvent({
    //       eventName: PAGE_CREATED,
    //       payload: {
    //         state: "FAILED",
    //       },
    //     });
    //   });
  };

  const handleFormSubmit = async () => {
    if (!workspaceSlug || !projectId) return;

    if (pageFormData.id) {
      try {
      } catch {
        console.log("something went wrong. Please try again later");
      }
    } else {
      try {
      } catch {
        console.log("something went wrong. Please try again later");
      }
    }

    // try {
    //   if (pageStore) {
    //     if (pageStore.name !== formData.name) {
    //       await pageStore.updateName(formData.name);
    //     }
    //     if (pageStore.access !== formData.access) {
    //       formData.access === 1 ? await pageStore.makePrivate() : await pageStore.makePublic();
    //     }
    //     capturePageEvent({
    //       eventName: PAGE_UPDATED,
    //       payload: {
    //         ...pageStore,
    //         state: "SUCCESS",
    //       },
    //     });
    //   } else {
    //     await createProjectPage(formData);
    //   }
    //   handleModalClose();
    // } catch (error) {
    //   console.log(error);
    // }
  };

  return (
    <Transition.Root show={isModalOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleModalClose}>
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

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="my-10 flex justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={React.Fragment}
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
                  handleModalClose={handleModalClose}
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
