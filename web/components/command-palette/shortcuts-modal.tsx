import { FC, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
// icons
import { Command, Search, X } from "lucide-react";
// ui
import { Input } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const KEYBOARD_SHORTCUTS = [
  {
    key: "navigation",
    title: "Navigation",
    shortcuts: [{ keys: "Ctrl,K", description: "Open command menu" }],
  },
  {
    key: "common",
    title: "Common",
    shortcuts: [
      { keys: "P", description: "Create project" },
      { keys: "C", description: "Create issue" },
      { keys: "Q", description: "Create cycle" },
      { keys: "M", description: "Create module" },
      { keys: "V", description: "Create view" },
      { keys: "D", description: "Create page" },
      { keys: "Delete", description: "Bulk delete issues" },
      { keys: "H", description: "Open shortcuts guide" },
      {
        keys: "Ctrl,Alt,C",
        description: "Copy issue URL from the issue details page",
      },
    ],
  },
];

export const ShortcutsModal: FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // states
  const [query, setQuery] = useState("");

  const handleClose = () => {
    onClose();
    setQuery("");
  };

  const filteredShortcuts = KEYBOARD_SHORTCUTS.map((category) => {
    const newCategory = { ...category };

    newCategory.shortcuts = newCategory.shortcuts.filter((shortcut) =>
      shortcut.description.toLowerCase().includes(query.trim().toLowerCase())
    );

    return newCategory;
  });

  const isShortcutsEmpty = filteredShortcuts.every((category) => category.shortcuts.length === 0);

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
              <Dialog.Panel className="h-full w-full grid place-items-center">
                <div className="relative flex flex-col rounded-lg bg-custom-background-100  shadow-custom-shadow-md transition-all p-5 space-y-4 h-[70vh] w-[28rem] overflow-hidden">
                  <Dialog.Title as="h3" className="flex justify-between">
                    <span className="text-lg font-medium">Keyboard Shortcuts</span>
                    <button type="button" onClick={handleClose}>
                      <X className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" aria-hidden="true" />
                    </button>
                  </Dialog.Title>
                  <div>
                    <div className="flex w-full items-center justify-start rounded border-[0.6px] border-custom-border-200 bg-custom-background-90 px-2">
                      <Search className="h-3.5 w-3.5 text-custom-text-200" />
                      <Input
                        id="search"
                        name="search"
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for shortcuts"
                        className="w-full border-none bg-transparent py-1 text-xs text-custom-text-200 focus:outline-none"
                        autoFocus
                        tabIndex={1}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-3 overflow-y-auto">
                    {!isShortcutsEmpty ? (
                      filteredShortcuts.map((category) => (
                        <div key={category.key}>
                          <h5 className="text-left text-sm font-medium">{category.title}</h5>
                          <div className="space-y-3 px-1">
                            {category.shortcuts.map((shortcut) => (
                              <div key={shortcut.keys} className="mt-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs text-custom-text-200">{shortcut.description}</h4>
                                  <div className="flex items-center gap-x-1.5">
                                    {shortcut.keys.split(",").map((key) => (
                                      <div key={key} className="flex items-center gap-1">
                                        {key === "Ctrl" ? (
                                          <div className="grid place-items-center rounded-sm border-[0.5px] border-custom-border-200 bg-custom-background-90 h-6 min-w-[1.5rem] px-1.5">
                                            <Command className="h-2.5 w-2.5 text-custom-text-200" />
                                          </div>
                                        ) : (
                                          <kbd className="grid place-items-center rounded-sm border-[0.5px] border-custom-border-200 bg-custom-background-90 h-6 min-w-[1.5rem] px-1.5 text-[10px] text-custom-text-200">
                                            {key}
                                          </kbd>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col gap-y-3">
                        <p className="text-sm text-custom-text-200">
                          No shortcuts found for{" "}
                          <span className="font-semibold italic">
                            {`"`}
                            {query}
                            {`"`}
                          </span>
                        </p>
                      </div>
                    )}
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
