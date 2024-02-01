import { Fragment, useState } from "react";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
import { AlertTriangle } from "lucide-react";
// hooks
import { useApplication, useCycle } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { Button } from "@plane/ui";
// types
import { ICycle } from "@plane/types";

interface ICycleDelete {
  cycle: ICycle;
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleDeleteModal: React.FC<ICycleDelete> = observer((props) => {
  const { isOpen, handleClose, cycle, workspaceSlug, projectId } = props;
  // states
  const [loader, setLoader] = useState(false);
  // router
  const router = useRouter();
  const { cycleId, peekCycle } = router.query;
  // store hooks
  const {
    eventTracker: { postHogEventTracker },
  } = useApplication();
  const { deleteCycle } = useCycle();
  // toast alert
  const { setToastAlert } = useToast();

  const formSubmit = async () => {
    if (!cycle) return;

    setLoader(true);
    try {
      await deleteCycle(workspaceSlug, projectId, cycle.id)
        .then(() => {
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle deleted successfully.",
          });
          postHogEventTracker("CYCLE_DELETE", {
            state: "SUCCESS",
          });
        })
        .catch(() => {
          postHogEventTracker("CYCLE_DELETE", {
            state: "FAILED",
          });
        });

      if (cycleId || peekCycle) router.push(`/${workspaceSlug}/projects/${projectId}/cycles`);

      handleClose();
    } catch (error) {
      setToastAlert({
        type: "error",
        title: "Warning!",
        message: "Something went wrong please try again later.",
      });
    }

    setLoader(false);
  };

  return (
    <div>
      <div>
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
              <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
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
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                    <div className="flex flex-col gap-6 p-6">
                      <div className="flex w-full items-center justify-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
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
                        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                          Cancel
                        </Button>

                        <Button variant="danger" size="sm" tabIndex={1} onClick={formSubmit}>
                          {loader ? "Deleting..." : "Delete Cycle"}
                        </Button>
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
