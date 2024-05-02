import { Fragment } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/ui";

type Props = {
  content: React.ReactNode | string;
  handleClose: () => void;
  handleSubmit: () => Promise<void>;
  isDeleting: boolean;
  isOpen: boolean;
  primaryButtonText?: {
    loading: string;
    default: string;
  };
  title: string;
};

export const DeleteModalCore: React.FC<Props> = (props) => {
  const {
    content,
    handleClose,
    handleSubmit,
    isDeleting,
    isOpen,
    primaryButtonText = {
      loading: "Deleting",
      default: "Delete",
    },
    title,
  } = props;

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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex items-end sm:items-center justify-center p-4 sm:p-0 text-center min-h-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 shadow-custom-shadow-md transition-all sm:my-8 sm:w-full sm:max-w-xl">
                <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <span className="flex-shrink-0 grid place-items-center rounded-full bg-red-500/20 size-12 sm:size-10">
                    <AlertTriangle className="size-5 text-red-500" aria-hidden="true" />
                  </span>
                  <div className="sm:text-left">
                    <h3 className="text-lg font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-custom-text-200">{content}</p>
                  </div>
                </div>
                <div className="px-5 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 border-t-[0.5px] border-custom-border-200">
                  <Button variant="neutral-primary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" tabIndex={1} onClick={handleSubmit} loading={isDeleting}>
                    {isDeleting ? primaryButtonText.loading : primaryButtonText.default}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
