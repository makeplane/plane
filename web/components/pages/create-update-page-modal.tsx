import React, { FC } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// components
import { PageForm } from "./page-form";
// types
import { IPage } from "@plane/types";
import { useProjectPages } from "hooks/store/use-project-page";
import { IPageStore } from "store/page.store";

type Props = {
  // data?: IPage | null;
  pageStore?: IPageStore;
  handleClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const CreateUpdatePageModal: FC<Props> = (props) => {
  const { isOpen, handleClose, projectId, pageStore } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { createPage } = useProjectPages();

  const createProjectPage = async (payload: IPage) => {
    if (!workspaceSlug) return;
    await createPage(workspaceSlug.toString(), projectId, payload);
  };

  const handleFormSubmit = async (formData: IPage) => {
    if (!workspaceSlug || !projectId) return;
    try {
      if (pageStore) {
        if (pageStore.name !== formData.name) {
          await pageStore.updateName(formData.name);
        }
        if (pageStore.access !== formData.access) {
          formData.access === 1 ? await pageStore.makePrivate() : await pageStore.makePublic();
        }
      } else {
        await createProjectPage(formData);
      }
      handleClose();
    } catch (error) {
      console.log(error);
    }
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
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 p-5 px-4 text-left shadow-custom-shadow-md transition-all sm:w-full sm:max-w-2xl">
                <PageForm handleFormSubmit={handleFormSubmit} handleClose={handleClose} pageStore={pageStore} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
