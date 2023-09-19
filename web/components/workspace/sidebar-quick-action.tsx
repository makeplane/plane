import React, { useState } from "react";

// ui
import { Icon } from "components/ui";
import { ChevronDown, PenSquare } from "lucide-react";
// headless ui
import { Menu, Transition } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { CreateUpdateDraftIssueModal } from "components/issues";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

export const WorkspaceSidebarQuickAction = () => {
  const store: any = useMobxStore();

  const [isDraftIssueModalOpen, setIsDraftIssueModalOpen] = useState(false);

  const { storedValue, clearValue } = useLocalStorage<any>("draftedIssue", null);

  return (
    <>
      <CreateUpdateDraftIssueModal
        isOpen={isDraftIssueModalOpen}
        handleClose={() => setIsDraftIssueModalOpen(false)}
        prePopulateData={storedValue ? JSON.parse(storedValue) : {}}
        onSubmit={() => {
          localStorage.removeItem("draftedIssue");
          clearValue();
          setIsDraftIssueModalOpen(false);
        }}
        fieldsToShow={[
          "name",
          "description",
          "label",
          "assignee",
          "priority",
          "dueDate",
          "priority",
          "state",
          "startDate",
          "project",
        ]}
      />

      <div
        className={`relative flex items-center justify-between w-full cursor-pointer px-4 mt-4 ${
          store?.theme?.sidebarCollapsed ? "flex-col gap-1" : "gap-2"
        }`}
      >
        <div
          className={`flex items-center justify-between w-full rounded cursor-pointer px-2 gap-1 ${
            store?.theme?.sidebarCollapsed
              ? "px-2 hover:bg-custom-sidebar-background-80"
              : "px-3 shadow border-[0.5px] border-custom-border-300"
          }`}
        >
          <button
            type="button"
            className="flex items-center gap-2 flex-grow rounded flex-shrink-0 py-1.5"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "c" });
              document.dispatchEvent(e);
            }}
          >
            <Icon
              iconName="edit_square"
              className="!text-lg !leading-4 text-custom-sidebar-text-300"
            />
            {!store?.theme?.sidebarCollapsed && (
              <span className="text-sm font-medium">New Issue</span>
            )}
          </button>

          {storedValue && <div className="h-8 w-0.5 bg-custom-sidebar-background-80" />}

          {storedValue && (
            <div className="relative">
              <Menu as={React.Fragment}>
                {({ open }) => (
                  <>
                    <div>
                      <Menu.Button
                        type="button"
                        className={`flex items-center justify-center rounded flex-shrink-0 p-1.5 ${
                          open ? "rotate-180 pl-0" : "rotate-0 pr-0"
                        }`}
                      >
                        <ChevronDown
                          size={16}
                          className="!text-custom-sidebar-text-300 transform transition-transform duration-300"
                        />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute -right-4 mt-1 w-52 bg-custom-background-300">
                        <div className="px-1 py-1 ">
                          <Menu.Item>
                            <button
                              onClick={() => setIsDraftIssueModalOpen(true)}
                              className="w-full flex text-sm items-center rounded flex-shrink-0 py-[10px] px-3 bg-custom-background-100 shadow border-[0.5px] border-custom-border-300 text-custom-text-300"
                            >
                              <PenSquare
                                size={16}
                                className="!text-lg !leading-4 text-custom-sidebar-text-300 mr-2"
                              />
                              Last Drafted Issue
                            </button>
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </>
                )}
              </Menu>
            </div>
          )}
        </div>

        <button
          className={`flex items-center justify-center rounded flex-shrink-0 p-2 ${
            store?.theme?.sidebarCollapsed
              ? "hover:bg-custom-sidebar-background-80"
              : "shadow border-[0.5px] border-custom-border-300"
          }`}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true });
            document.dispatchEvent(e);
          }}
        >
          <Icon iconName="search" className="!text-lg !leading-4 text-custom-sidebar-text-300" />
        </button>
      </div>
    </>
  );
};
