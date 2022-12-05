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
                <div className="bg-white p-5">
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
                              { keys: "ctrl,/", description: "To open navigator" },
                              { keys: "↑", description: "Move up" },
                              { keys: "↓", description: "Move down" },
                              { keys: "←", description: "Move left" },
                              { keys: "→", description: "Move right" },
                              { keys: "Enter", description: "Select" },
                              { keys: "Esc", description: "Close" },
                            ],
                          },
                          {
                            title: "Common",
                            shortcuts: [
                              { keys: "ctrl,p", description: "To create project" },
                              { keys: "ctrl,i", description: "To create issue" },
                              { keys: "ctrl,q", description: "To create cycle" },
                              { keys: "ctrl,h", description: "To open shortcuts guide" },
                              {
                                keys: "ctrl,alt,c",
                                description: "To copy issue url when on issue detail page.",
                              },
                            ],
                          },
                        ].map(({ title, shortcuts }) => (
                          <div key={title} className="w-full flex flex-col">
                            <p className="font-medium mb-4">{title}</p>
                            <div className="flex flex-col gap-y-3">
                              {shortcuts.map(({ keys, description }, index) => (
                                <div key={index} className="flex justify-between">
                                  <p className="text-sm text-gray-500">{description}</p>
                                  <div className="flex items-center gap-x-1">
                                    {keys.split(",").map((key, index) => (
                                      <span key={index} className="flex items-center gap-1">
                                        <kbd className="bg-gray-200 text-sm px-1 rounded">
                                          {key}
                                        </kbd>
                                        {/* {index !== keys.split(",").length - 1 ? (
                                          <span className="text-xs">+</span>
                                        ) : null} */}
                                      </span>
                                    ))}
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
