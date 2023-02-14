import React from "react";

// ui
import { Listbox, Transition } from "@headlessui/react";
// icons
import { getPriorityIcon } from "components/icons/priority-icon";
// types
import { IIssue } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  position?: "left" | "right";
  isNotAllowed: boolean;
};

export const ViewPrioritySelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  position = "right",
  isNotAllowed,
}) => (
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
          <Listbox.Options
            className={`absolute z-10 mt-1 max-h-48 w-36 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
              position === "left" ? "left-0" : "right-0"
            }`}
          >
            {PRIORITIES?.map((priority) => (
              <Listbox.Option
                key={priority}
                className={({ active, selected }) =>
                  `${active || selected ? "bg-indigo-50" : ""} ${
                    selected ? "font-medium" : ""
                  } flex cursor-pointer select-none items-center gap-x-2 px-3 py-2 capitalize`
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
    )}
  </Listbox>
);
