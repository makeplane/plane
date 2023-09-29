import React from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { WorkspaceViewForm } from "components/workspace/views/form";
// types
import { IWorkspaceView } from "types/workspace-views";
// fetch-keys
import { WORKSPACE_VIEWS_LIST } from "constants/fetch-keys";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IWorkspaceView | null;
  preLoadedData?: Partial<IWorkspaceView> | null;
};

export const CreateUpdateWorkspaceViewModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  data,
  preLoadedData,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const onClose = () => {
    handleClose();
  };

  const createView = async (payload: any) => {
    const payloadData = {
      ...payload,
      query_data: {
        filters: payload.query,
      },
    };
    await workspaceService
      .createView(workspaceSlug as string, payloadData)
      .then((res) => {
        mutate(WORKSPACE_VIEWS_LIST(workspaceSlug as string));
        handleClose();

        router.replace(`/${workspaceSlug}/workspace-views/issues?globalViewId=${res.id}`);

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "View could not be created. Please try again.",
        });
      });
  };

  const updateView = async (payload: any) => {
    const payloadData = {
      ...payload,
      query_data: {
        filters: payload.query,
      },
    };
    await workspaceService
      .updateView(workspaceSlug as string, data?.id ?? "", payloadData)
      .then((res) => {
        mutate<IWorkspaceView[]>(
          WORKSPACE_VIEWS_LIST(workspaceSlug as string),
          (prevData) =>
            prevData?.map((p) => {
              if (p.id === res.id) return { ...p, ...payloadData };

              return p;
            }),
          false
        );
        onClose();

        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View updated successfully.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "View could not be updated. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: any) => {
    if (!workspaceSlug) return;

    if (!data) await createView(formData);
    else await updateView(formData);
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
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <WorkspaceViewForm
                  handleFormSubmit={handleFormSubmit}
                  handleClose={handleClose}
                  status={data ? true : false}
                  data={data}
                  preLoadedData={preLoadedData}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
