import React, { FC } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
// components
import { PageForm } from "./page-form";
// types
import { IPage } from "types";
// store
import { useMobxStore } from "lib/mobx/store-provider";

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
  // store
  const {
    page: { createPage, updatePage },
    trackEvent: { postHogEventTracker },
    workspace: { currentWorkspace },
  } = useMobxStore();

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
  };

  const createProjectPage = async (payload: IPage) => {
    if (!workspaceSlug) return;

    await createPage(workspaceSlug.toString(), projectId, payload)
      .then((res) => {
        router.push(`/${workspaceSlug}/projects/${projectId}/pages/${res.id}`);
        onClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page created successfully.",
        });
        postHogEventTracker(
          "PAGE_CREATED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Page could not be created. Please try again.",
        });
        postHogEventTracker(
          "PAGE_CREATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      });
  };

  const updateProjectPage = async (payload: IPage) => {
    if (!data || !workspaceSlug) return;

    await updatePage(workspaceSlug.toString(), projectId, data.id, payload)
      .then((res) => {
        onClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Page updated successfully.",
        });
        postHogEventTracker(
          "PAGE_UPDATED",
          {
            ...res,
            state: "SUCCESS",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err.detail ?? "Page could not be updated. Please try again.",
        });
        postHogEventTracker(
          "PAGE_UPDATED",
          {
            state: "FAILED",
          },
          {
            isGrouping: true,
            groupType: "Workspace_metrics",
            gorupId: currentWorkspace?.id!,
          }
        );
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
