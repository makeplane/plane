import { Fragment, ReactNode } from "react";
// Headless ui imports
import { Dialog, Transition } from "@headlessui/react";
// Design components
import { Button } from "ui";
// Icons
import { XMarkIcon } from "@heroicons/react/24/outline";

type ModalProps = {
  isModal: boolean;
  setModal: Function;
  size?: "xs" | "rg" | "lg" | "xl";
  position?: "top" | "center" | "bottom";
  title: string;
  children: ReactNode;
  buttons?: ReactNode;
  onClose?: Function;
  closeButton?: string;
  continueButton?: string;
};

const Modal = (props: ModalProps) => {
  const closeModal = () => {
    props.setModal(false);
    props.onClose ? props.onClose() : () => {};
  };

  const width: string =
    props.size === "xs"
      ? "w-4/12"
      : props.size === "rg"
      ? "w-6/12"
      : props.size === "lg"
      ? "w-9/12"
      : props.size === "xl"
      ? "w-full"
      : "w-auto";

  const position: string =
    props.position === "top"
      ? "content-start justify-items-center"
      : props.position === "center"
      ? "place-items-center"
      : props.position === "bottom"
      ? "content-end justify-items-center"
      : "place-items-center";

  return (
    <>
      <Transition appear show={props.isModal} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0">
            <div className={`grid h-full ${position} p-4 text-center`}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className={`transform rounded-2xl ${width} max-h-full bg-white p-8 text-left shadow-xl transition-all`}
                >
                  <Dialog.Title
                    as="h3"
                    className="relative text-lg font-medium leading-6 text-gray-900"
                  >
                    <div
                      className="absolute top-[-1rem] right-[-1rem] cursor-pointer"
                      onClick={closeModal}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </div>
                    <div>{props.title}</div>
                  </Dialog.Title>
                  <div className="mt-2">{props.children}</div>
                  <div className="mt-4">
                    <div className={`flex justify-end gap-2`}>
                      <Button theme="secondary" onClick={closeModal}>
                        {props.closeButton}
                      </Button>
                      <Button onClick={closeModal}>{props.continueButton}</Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

Modal.defaultProps = {
  size: "rg",
  position: "center",
  closeButton: "Close",
  continueButton: "Continue",
};

export default Modal;
