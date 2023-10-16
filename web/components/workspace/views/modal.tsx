import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { WorkspaceViewForm } from "components/workspace";
// types
import { IWorkspaceView } from "types/workspace-views";

type Props = {
  data?: IWorkspaceView;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<IWorkspaceView>;
};

export const CreateUpdateWorkspaceViewModal: React.FC<Props> = observer((props) => {
  const { isOpen, onClose, data, preLoadedData } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { globalViews: globalViewsStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const handleClose = () => {
    onClose();
  };

  const createView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    const payloadData: Partial<IWorkspaceView> = {
      ...payload,
      query: {
        ...payload.query_data?.filters,
      },
    };

    await globalViewsStore
      .createGlobalView(workspaceSlug.toString(), payloadData)
      .then((res) => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View created successfully.",
        });

        router.push(`/${workspaceSlug}/workspace-views/${res.id}`);
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "View could not be created. Please try again.",
        })
      );
  };

  const updateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug || !data) return;

    const payloadData: Partial<IWorkspaceView> = {
      ...payload,
      query: {
        ...payload.query_data?.filters,
      },
    };

    await globalViewsStore
      .updateGlobalView(workspaceSlug.toString(), data.id, payloadData)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View updated successfully.",
        })
      )
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "View could not be updated. Please try again.",
        })
      );
  };

  const handleFormSubmit = async (formData: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    if (!data) await createView(formData);
    else await updateView(formData);

    handleClose();
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
});
