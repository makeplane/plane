import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
import { AlertTriangle } from "lucide-react";
// components
import { DangerButton, SecondaryButton } from "components/ui";
// hooks
import useToast from "hooks/use-toast";
// types
import { ICycle } from "types";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

interface ICycleDelete {
  cycle: ICycle;
  modal: boolean;
  modalClose: () => void;
  onSubmit?: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleDeleteModal: React.FC<ICycleDelete> = observer((props) => {
  const { modal, modalClose, cycle, onSubmit, workspaceSlug, projectId } = props;

  const { cycle: cycleStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const [loader, setLoader] = useState(false);
  const formSubmit = async () => {
    setLoader(true);

    if (cycle?.id)
      try {
        await cycleStore.removeCycle(workspaceSlug, projectId, cycle?.id);
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Cycle deleted successfully.",
        });
        if (modalClose) modalClose();
        if (onSubmit) onSubmit();
      } catch (error) {
        setToastAlert({
          type: "error",
          title: "Warning!",
          message: "Something went wrong please try again later.",
        });
      }
    else
      setToastAlert({
        type: "error",
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });

    setLoader(false);
  };

  return (
    <div>
      <div>
        <Transition.Root show={modal} as={Fragment}>
          <Dialog as="div" className="relative z-20" onClose={modalClose}>
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

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                    <div className="flex flex-col gap-6 p-6">
                      <div className="flex w-full items-center justify-start gap-4">
                        <div className="flex-shrink-0 flex justify-center items-center rounded-full bg-red-500/20 w-12 h-12">
                          <AlertTriangle width={16} strokeWidth={2} className="text-red-600" />
                        </div>
                        <div className="text-xl font-medium 2xl:text-2xl">Delete Cycle</div>
                      </div>
                      <span>
                        <p className="text-sm text-custom-text-200">
                          Are you sure you want to delete cycle{' "'}
                          <span className="break-words font-medium text-custom-text-100">{cycle?.name}</span>
                          {'"'}? All of the data related to the cycle will be permanently removed. This action cannot be
                          undone.
                        </p>
                      </span>
                      <div className="flex justify-end gap-2">
                        <SecondaryButton onClick={modalClose}>Cancel</SecondaryButton>
                        <DangerButton onClick={formSubmit} loading={loader}>
                          {loader ? "Deleting..." : "Delete Cycle"}
                        </DangerButton>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </div>
  );
});
