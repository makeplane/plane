import React, { FC } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// components
import { PageForm } from "./page-form";
// types
import { IUser, IPage } from "types";
// store
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IPage | null;
  user: IUser | undefined;
  workspaceSlug: string;
  projectId: string;
};

export const CreateUpdatePageModal: FC<Props> = (props) => {
  const { isOpen, handleClose, data, workspaceSlug, projectId } = props;
  // router
  const router = useRouter();
  // store
  const {
    page: { createPage, updatePage },
  } = useMobxStore();

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
  };

  const createProjectPage = async (payload: IPage) =>
    createPage(workspaceSlug, projectId, payload)
      .then((res) => {
        router.push(`/${workspaceSlug}/projects/${projectId}/pages/${res.id}`);
        onClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again.",
        });
      });

  const updateProjectPage = async (payload: IPage) => {
    if (!data) return;
    return updatePage(workspaceSlug, projectId, data.id, payload)
      .then(() => {
        onClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: IPage) => {
    if (!workspaceSlug || !projectId) return;
    if (!data) await createProjectPage(formData);
    else await updateProjectPage(formData);
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
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-custom-background-100 px-5 py-8 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <PageForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                  data={data}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
