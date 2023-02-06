import React from "react";

// ui
import { Listbox, Transition } from "@headlessui/react";
// types
import { IIssue, IState } from "types";
// constants
import { getPriorityIcon } from "constants/global";
import { PRIORITIES } from "constants/";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  isNotAllowed: boolean;
};

export const PrioritySelect: React.FC<Props> = ({ issue, partialUpdateIssue, isNotAllowed }) => (
  <Listbox
    as="div"
    value={issue.priority}
    onChange={(data: string) => {
      partialUpdateIssue({ priority: data });
    }}
    className="group relative flex-shrink-0"
    disabled={isNotAllowed}
  >
    {({ open }) => (
      <>
        <div>
          <Listbox.Button
            className={`flex ${
              isNotAllowed ? "cursor-not-allowed" : "cursor-pointer"
            } items-center gap-x-2 rounded px-2 py-0.5 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              issue.priority === "urgent"
                ? "bg-red-100 text-red-600"
                : issue.priority === "high"
                ? "bg-orange-100 text-orange-500"
                : issue.priority === "medium"
                ? "bg-yellow-100 text-yellow-500"
                : issue.priority === "low"
                ? "bg-green-100 text-green-500"
                : "bg-gray-100"
            }`}
          >
            {getPriorityIcon(
              issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
              "text-sm"
            )}
          </Listbox.Button>

          <Transition
            show={open}
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-48 w-36 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {PRIORITIES?.map((priority) => (
                <Listbox.Option
                  key={priority}
                  className={({ active }) =>
                    `flex cursor-pointer select-none items-center gap-x-2 px-3 py-2 capitalize ${
                      active ? "bg-indigo-50" : "bg-white"
                    }`
                  }
                  value={priority}
                >
                  {getPriorityIcon(priority, "text-sm")}
                  {priority ?? "None"}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
        <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
          <h5 className="mb-1 font-medium text-gray-900">Priority</h5>
          <div
            className={`capitalize ${
              issue.priority === "urgent"
                ? "text-red-600"
                : issue.priority === "high"
                ? "text-orange-500"
                : issue.priority === "medium"
                ? "text-yellow-500"
                : issue.priority === "low"
                ? "text-green-500"
                : ""
            }`}
          >
            {issue.priority ?? "None"}
          </div>
        </div>
      </>
    )}
  </Listbox>
);
