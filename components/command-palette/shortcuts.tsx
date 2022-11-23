import React from "react";
// headless ui
import { Dialog, Transition } from "@headlessui/react";
// icons
import { XMarkIcon } from "@heroicons/react/20/solid";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ShortcutsModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setIsOpen}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white p-8">
                  <div className="sm:flex sm:items-start">
                    <div className="text-center sm:text-left w-full">
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900 flex justify-between"
                      >
                        <span>Keyboard Shortcuts</span>
                        <span>
                          <button type="button" onClick={() => setIsOpen(false)}>
                            <XMarkIcon
                              className="h-6 w-6 text-gray-400 hover:text-gray-500"
                              aria-hidden="true"
                            />
                          </button>
                        </span>
                      </Dialog.Title>
                      <div className="mt-2 pt-5 flex flex-col gap-y-3 w-full">
                        {[
                          {
                            title: "Navigation",
                            shortcuts: [
                              { key: "Ctrl + /", description: "To open navigator" },
                              { key: "↑", description: "Move up" },
                              { key: "↓", description: "Move down" },
                              { key: "←", description: "Move left" },
                              { key: "→", description: "Move right" },
                              { key: "Enter", description: "Select" },
                              { key: "Esc", description: "Close" },
                            ],
                          },
                          {
                            title: "Common",
                            shortcuts: [
                              { key: "Ctrl + p", description: "To open create project modal" },
                              { key: "Ctrl + i", description: "To open create issue modal" },
                              { key: "Ctrl + q", description: "To open create cycle modal" },
                              { key: "Ctrl + h", description: "To open shortcuts guide" },
                              {
                                key: "Ctrl + alt + c",
                                description: "To copy issue url when on issue detail page.",
                              },
                            ],
                          },
                        ].map(({ title, shortcuts }) => (
                          <div className="w-full flex flex-col" key={title}>
                            <p className="font-medium mb-4">{title}</p>
                            <div className="flex flex-col gap-y-3">
                              {shortcuts.map(({ key, description }) => (
                                <div className="flex justify-between" key={key}>
                                  <p className="text-sm text-gray-500">{description}</p>
                                  <div className="flex gap-x-1">
                                    <kbd className="bg-gray-200 text-sm px-1 rounded">{key}</kbd>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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

export default ShortcutsModal;
