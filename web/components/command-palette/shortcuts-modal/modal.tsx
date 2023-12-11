import { FC, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Search, X } from "lucide-react";
// components
import { ShortcutCommandsList } from "components/command-palette";
// ui
import { Input } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export const ShortcutsModal: FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [query, setQuery] = useState("");

  const handleClose = () => {
    onClose();
    setQuery("");
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
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 h-full w-full overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <Dialog.Panel className="h-full w-full">
              <div className="grid h-full w-full place-items-center p-5">
                <div className="flex h-[61vh] w-full flex-col  space-y-4 overflow-hidden rounded-lg bg-custom-background-100 p-5 shadow-custom-shadow-md transition-all sm:w-[28rem]">
                  <Dialog.Title as="h3" className="flex justify-between">
                    <span className="text-lg font-medium">Keyboard shortcuts</span>
                    <button type="button" onClick={handleClose}>
                      <X className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" aria-hidden="true" />
                    </button>
                  </Dialog.Title>
                  <div className="flex w-full items-center rounded border-[0.5px] border-custom-border-200 bg-custom-background-90 px-2">
                    <Search className="h-3.5 w-3.5 text-custom-text-200" />
                    <Input
                      id="search"
                      name="search"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for shortcuts"
                      className="w-full border-none bg-transparent py-1 text-xs text-custom-text-200 outline-none"
                      autoFocus
                      tabIndex={1}
                    />
                  </div>
                  <ShortcutCommandsList searchQuery={query} />
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
