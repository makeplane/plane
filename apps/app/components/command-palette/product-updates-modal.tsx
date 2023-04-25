import React from "react";
import useSWR from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// icons
import { XMarkIcon } from "@heroicons/react/20/solid";
import workspaceService from "services/workspace.service";
import { MarkdownRenderer } from "components/ui";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ProductUpdatesModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const { data: updates } = useSWR("PRODUCT_UPDATES", () => workspaceService.getProductUpdates());
  console.log("updates:", updates);
  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20 max-h-96 overflow-y-auto" onClose={setIsOpen}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="max-h-[600px] overflow-y-auto bg-white p-5">
                  <div className="sm:flex sm:items-start">
                    <div className="flex w-full flex-col gap-y-4 text-center sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="flex justify-between text-lg font-medium leading-6 text-gray-900"
                      >
                        <span>Product Updates</span>
                        <span>
                          <button type="button" onClick={() => setIsOpen(false)}>
                            <XMarkIcon
                              className="h-6 w-6 text-gray-400 hover:text-gray-500"
                              aria-hidden="true"
                            />
                          </button>
                        </span>
                      </Dialog.Title>
                      {updates &&
                        updates.length > 0 &&
                        updates.map((item: any) => <MarkdownRenderer markdown={item.body} />)}
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
