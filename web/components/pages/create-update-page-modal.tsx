import React, { FC } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useApplication, usePage, useWorkspace } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { trace } from "mobx";
import { PageForm } from "./page-form";
// types
import { IPage } from "@plane/types";
import { useProjectSpecificPages } from "hooks/store/use-project-specific-pages";
import { useProjectPages } from "hooks/store/use-project-page";

type Props = {
  data?: IPage | null;
  handleClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const CreateUpdatePageModal: FC<Props> = (props) => {
  const { isOpen, handleClose, data, projectId } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { createPage: createPageMobx } = useProjectPages();
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { currentWorkspace } = useWorkspace();
  const { createPage, updatePage } = usePage();
  // toast alert
  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
  };

  const createProjectPage = async (payload: IPage) => {
    if (!workspaceSlug) return;
    createPageMobx(workspaceSlug.toString(), projectId, payload);
  };

  // const updateProjectPage = async (payload: IPage) => {
  //   if (!data || !workspaceSlug) return;
  // };

  const handleFormSubmit = async (formData: IPage) => {
    if (!workspaceSlug || !projectId) return;
    await createProjectPage(formData);

    // if (!data) await createProjectPage(formData);
    // TODO: implement update page
    // else await updateProjectPage(formData);
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
                <PageForm handleFormSubmit={handleFormSubmit} handleClose={handleClose} data={data} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
