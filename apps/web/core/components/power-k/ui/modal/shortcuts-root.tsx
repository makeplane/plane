import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
// plane imports
import { CloseIcon, SearchIcon } from "@plane/propel/icons";
import { Input } from "@plane/ui";
// hooks
import { usePowerK } from "@/hooks/store/use-power-k";
// local imports
import { ShortcutRenderer } from "../renderer/shortcut";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ShortcutsModal(props: Props) {
  const { isOpen, onClose } = props;
  // states
  const [query, setQuery] = useState("");
  // store hooks
  const { commandRegistry } = usePowerK();

  // Get all commands from registry
  const allCommandsWithShortcuts = commandRegistry.getAllCommandsWithShortcuts();

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto">
          <div className="my-10 flex items-center justify-center p-4 text-center sm:p-0 md:my-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative flex h-full items-center justify-center">
                <div className="flex h-[61vh] w-full flex-col  space-y-4 overflow-hidden rounded-lg bg-surface-1 p-5 shadow-raised-200 transition-all sm:w-[28rem]">
                  <Dialog.Title as="h3" className="flex justify-between">
                    <span className="text-16 font-medium">Keyboard shortcuts</span>
                    <button type="button" onClick={handleClose}>
                      <CloseIcon className="h-4 w-4 text-secondary hover:text-primary" aria-hidden="true" />
                    </button>
                  </Dialog.Title>
                  <div className="flex w-full items-center rounded-sm border-[0.5px] border-subtle bg-surface-2 px-2">
                    <SearchIcon className="h-3.5 w-3.5 text-secondary" />
                    <Input
                      id="search"
                      name="search"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for shortcuts"
                      className="w-full border-none bg-transparent py-1 text-11 text-secondary outline-none"
                      autoFocus
                      tabIndex={1}
                    />
                  </div>
                  <ShortcutRenderer searchQuery={query} commands={allCommandsWithShortcuts} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
