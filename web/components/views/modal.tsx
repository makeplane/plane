import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import useToast from "hooks/use-toast";
// components
import { ProjectViewForm } from "components/views";
// types
import { IProjectView } from "types";

type Props = {
  data?: IProjectView | null;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<IProjectView> | null;
  workspaceSlug: string;
  projectId: string;
};

export const CreateUpdateProjectViewModal: FC<Props> = observer((props) => {
  const { data, isOpen, onClose, preLoadedData, workspaceSlug, projectId } = props;
  // store
  const { projectViews: projectViewsStore } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  const handleClose = () => {
    onClose();
  };

  const createView = async (payload: IProjectView) => {
    await projectViewsStore
      .createView(workspaceSlug, projectId, payload)
      .then(() => {
        handleClose();
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const updateView = async (payload: IProjectView) => {
    await projectViewsStore
      .updateView(workspaceSlug, projectId, data?.id as string, payload)
      .then(() => handleClose())
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        })
      );
  };

  const handleFormSubmit = async (formData: IProjectView) => {
    if (!data) await createView(formData);
    else await updateView(formData);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
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
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 px-5 py-8 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <ProjectViewForm
                  data={data}
                  handleClose={handleClose}
                  handleFormSubmit={handleFormSubmit}
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
