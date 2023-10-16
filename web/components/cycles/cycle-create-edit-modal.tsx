import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { observer } from "mobx-react-lite";
// components
import { CycleForm } from "./form";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { CycleDateCheckData, ICycle } from "types";

interface ICycleCreateEdit {
  cycle?: ICycle | null;
  modal: boolean;
  modalClose: () => void;
  onSubmit?: () => void;
  workspaceSlug: string;
  projectId: string;
}

export const CycleCreateEditModal: React.FC<ICycleCreateEdit> = observer((props) => {
  const { modal, modalClose, cycle = null, onSubmit, workspaceSlug, projectId } = props;

  const { cycle: cycleStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const validateCycleDate = async (payload: CycleDateCheckData) => {
    let status = false;
    await cycleStore.validateDate(workspaceSlug as string, projectId as string, payload).then((res) => {
      status = res.status;
    });
    return status;
  };

  const formSubmit = async (data: Partial<ICycle>) => {
    let isDateValid: boolean = true;

    if (data?.start_date && data?.end_date) {
      if (cycle?.id && cycle?.start_date && cycle?.end_date)
        isDateValid = await validateCycleDate({
          start_date: data.start_date,
          end_date: data.end_date,
          cycle_id: cycle.id,
        });
      else
        isDateValid = await validateCycleDate({
          start_date: data.start_date,
          end_date: data.end_date,
        });
    }

    if (isDateValid)
      if (cycle) {
        try {
          await cycleStore.updateCycle(workspaceSlug, projectId, cycle.id, data);
          if (modalClose) modalClose();
          if (onSubmit) onSubmit();
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle updated successfully.",
          });
        } catch (error) {
          console.log("error", error);
          setToastAlert({
            type: "error",
            title: "Warning!",
            message: "Something went wrong please try again later.",
          });
        }
      } else {
        try {
          await cycleStore.createCycle(workspaceSlug, projectId, data);
          if (modalClose) modalClose();
          if (onSubmit) onSubmit();
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "Cycle created successfully.",
          });
        } catch (error) {
          console.log("error", error);
          setToastAlert({
            type: "error",
            title: "Warning!",
            message: "Something went wrong please try again later.",
          });
        }
      }
    else
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "You already have a cycle on the given dates, if you want to create a draft cycle, remove the dates.",
      });
  };

  return (
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
              <Dialog.Panel className="relative transform rounded-lg border border-custom-border-200 bg-custom-background-100 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl p-5">
                <CycleForm handleFormSubmit={formSubmit} handleClose={modalClose} data={cycle} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
