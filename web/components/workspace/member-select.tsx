import { FC, useState, Fragment } from "react";
import { Combobox, Transition, Listbox } from "@headlessui/react";
import { IWorkspaceMember } from "types";
import { ChevronDown, Check } from "lucide-react";

export interface IWorkspaceMemberSelect {
  value: IWorkspaceMember | null;
  onChange: (value: IWorkspaceMember) => void;
  options: IWorkspaceMember[];
  placeholder?: string;
}

export const WorkspaceMemberSelect: FC<IWorkspaceMemberSelect> = (props) => {
  const { value, onChange, options, placeholder = "Select Member" } = props;
  // states
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option: any) =>
          option.name.toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  return (
    // <Combobox value={value} onChange={onChange}>
    //   <div className="relative mt-1">
    //     <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
    //       <Combobox.Input
    //         placeholder={placeholder}
    //         className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
    //         displayValue={(option: IWorkspaceMember) => (option ? option.member.display_name : "")}
    //         onChange={(event) => setQuery(event.target.value)}
    //       />
    //       <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
    //         <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
    //       </Combobox.Button>
    //     </div>
    //     <Transition
    //       as={Fragment}
    //       leave="transition ease-in duration-100"
    //       leaveFrom="opacity-100"
    //       leaveTo="opacity-0"
    //       afterLeave={() => setQuery("")}
    //     >
    //       <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
    //         {filteredOptions.length === 0 && query !== "" ? (
    //           <div className="relative cursor-default select-none py-2 px-4 text-gray-700">Nothing found.</div>
    //         ) : (
    //           filteredOptions.map((option) => (
    //             <Combobox.Option
    //               key={option.id}
    //               className={({ active }) =>
    //                 `relative cursor-default select-none py-2 pl-10 pr-4 ${
    //                   active ? "bg-teal-600 text-white" : "text-gray-900"
    //                 }`
    //               }
    //               value={option}
    //             >
    //               {({ selected, active }) => (
    //                 <>
    //                   <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
    //                     {option.member.display_name}
    //                   </span>
    //                   {selected ? (
    //                     <span
    //                       className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
    //                         active ? "text-white" : "text-teal-600"
    //                       }`}
    //                     >
    //                       <Check className="h-5 w-5" aria-hidden="true" />
    //                     </span>
    //                   ) : null}
    //                 </>
    //               )}
    //             </Combobox.Option>
    //           ))
    //         )}
    //       </Combobox.Options>
    //     </Transition>
    //   </div>
    // </Combobox>

    <Listbox value={value} onChange={onChange}>
      <div className="relative mt-1">
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
          <span className="block truncate">{value ? value.member.display_name : placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="z-10 min-w-[10rem] border border-custom-border-300 p-2 rounded-md bg-custom-background-90 text-xs shadow-custom-shadow-rg focus:outline-none my-1 whitespace-nowrap">
            {filteredOptions.map((option) => (
              <Listbox.Option
                key={option.id}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                  }`
                }
                value={option}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                      {option.member.display_name}
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
};
