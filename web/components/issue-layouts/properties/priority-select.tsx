import { FC, Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { useMobxStore } from "lib/mobx/store-provider";
import { IIssue } from "types";
import { observer } from "mobx-react-lite";
import { Check } from "lucide-react";

export interface IIssuePrioritySelect {
  issue: IIssue;
  groupId: string;
}

export const IssuePrioritySelect: FC<IIssuePrioritySelect> = observer((props) => {
  const { issue, groupId } = props;

  const { issueView: issueViewStore, issueFilters: issueFilterStore } = useMobxStore();
  const priorityList = issueFilterStore.issueRenderFilters.priority;

  const selected = priorityList.find((p) => p.key === issue.priority);

  const changePriority = (selectedPriority: any) => {
    issueViewStore.updateIssues(groupId, issue.id, { priority: selectedPriority.key });
  };

  return (
    <Listbox value={selected} onChange={changePriority}>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-3 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
          <span className="block truncate text-xs">{selected?.title || "None"}</span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute mt-1 max-h-60 w-[200px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
            {priorityList.map((priority) => (
              <Listbox.Option
                key={priority.key}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                  }`
                }
                value={priority}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                      {priority.title}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                        <Check className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
});
