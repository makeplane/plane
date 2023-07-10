import React from "react";
import useSWR from "swr";

// headless ui
import { Dialog, Transition } from "@headlessui/react";
// component
import { MarkdownRenderer, Spinner } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/20/solid";
// services
import workspaceService from "services/workspace.service";
// helper
import { renderLongDateFormat } from "helpers/date-time.helper";

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ProductUpdatesModal: React.FC<Props> = ({ isOpen, setIsOpen }) => {
  const { data: updates } = useSWR("PRODUCT_UPDATES", () => workspaceService.getProductUpdates());
  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={setIsOpen}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-80 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="max-h-[600px] overflow-y-auto bg-custom-background-80 p-5">
                  <div className="sm:flex sm:items-start">
                    <div className="flex w-full flex-col gap-y-4 text-center sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="flex justify-between text-lg font-medium leading-6 text-custom-text-100"
                      >
                        <span>Product Updates</span>
                        <span>
                          <button type="button" onClick={() => setIsOpen(false)}>
                            <XMarkIcon
                              className="h-6 w-6 text-custom-text-200 hover:text-custom-text-100"
                              aria-hidden="true"
                            />
                          </button>
                        </span>
                      </Dialog.Title>
                      {updates && updates.length > 0 ? (
                        updates.map((item, index) => (
                          <React.Fragment key={item.id}>
                            <div className="flex items-center gap-3 text-xs text-custom-text-200">
                              <span className="flex items-center rounded-full border border-custom-border-100 bg-custom-background-90 px-3 py-1.5 text-xs">
                                {item.tag_name}
                              </span>
                              <span>{renderLongDateFormat(item.published_at)}</span>
                              {index === 0 && (
                                <span className="flex items-center rounded-full border border-custom-border-100 bg-custom-primary px-3 py-1.5 text-xs text-white">
                                  New
                                </span>
                              )}
                            </div>
                            <MarkdownRenderer markdown={item.body} />
                          </React.Fragment>
                        ))
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Spinner />
                          Loading...
                        </div>
                      )}
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
