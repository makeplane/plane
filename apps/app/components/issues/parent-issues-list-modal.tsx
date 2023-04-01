import React, { useState } from "react";

// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// icons
import { MagnifyingGlassIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// types
import { IIssue } from "types";
import { LayerDiagonalIcon } from "components/icons";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  value?: any;
  onChange: (...event: any[]) => void;
  issues: IIssue[];
  title?: string;
  multiple?: boolean;
  customDisplay?: JSX.Element;
};

export const ParentIssuesListModal: React.FC<Props> = ({
  isOpen,
  handleClose: onClose,
  value,
  onChange,
  issues,
  title = "Issues",
  multiple = false,
  customDisplay,
}) => {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<string[]>([]);

  const handleClose = () => {
    onClose();
    setQuery("");
    setValues([]);
  };

  const filteredIssues: IIssue[] =
    query === ""
      ? issues ?? []
      : issues?.filter((issue) => issue.name.toLowerCase().includes(query.toLowerCase())) ?? [];

  return (
    <>
      <Transition.Root show={isOpen} as={React.Fragment} afterLeave={() => setQuery("")} appear>
        <Dialog as="div" className="relative z-20" onClose={handleClose}>
          <Transition.Child
            as={React.Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-20 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative mx-auto max-w-2xl transform divide-y divide-gray-500 divide-opacity-10 rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
                {multiple ? (
                  <>
                    <Combobox value={value} onChange={() => ({})} multiple>
                      <div className="relative m-1">
                        <MagnifyingGlassIcon
                          className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                          aria-hidden="true"
                        />
                        <Combobox.Input
                          className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                          placeholder="Search..."
                          onChange={(e) => setQuery(e.target.value)}
                          displayValue={() => ""}
                        />
                      </div>
                      {customDisplay && <div className="p-3">{customDisplay}</div>}
                      <Combobox.Options
                        static
                        className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                      >
                        {filteredIssues.length > 0 && (
                          <li className="p-2">
                            {query === "" && (
                              <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                                {title}
                              </h2>
                            )}
                            <ul className="text-sm text-gray-700">
                              {filteredIssues.map((issue) => (
                                <Combobox.Option
                                  key={issue.id}
                                  value={issue.id}
                                  className={({ active }) =>
                                    `flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 ${
                                      active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <input type="checkbox" checked={selected} readOnly />
                                      <span
                                        className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                        style={{
                                          backgroundColor: issue.state_detail.color,
                                        }}
                                      />
                                      <span className="flex-shrink-0 text-xs text-gray-500">
                                        {issue.project_detail?.identifier}-{issue.sequence_id}
                                      </span>{" "}
                                      {issue.id}
                                    </>
                                  )}
                                </Combobox.Option>
                              ))}
                            </ul>
                          </li>
                        )}
                      </Combobox.Options>

                      {query !== "" && filteredIssues.length === 0 && (
                        <div className="py-14 px-6 text-center sm:px-14">
                          <RectangleStackIcon
                            className="mx-auto h-6 w-6 text-gray-900 text-opacity-40"
                            aria-hidden="true"
                          />
                          <p className="mt-4 text-sm text-gray-900">
                            We couldn{"'"}t find any issue with that term. Please try again.
                          </p>
                        </div>
                      )}
                    </Combobox>
                    <div className="flex items-center justify-end gap-2 p-3">
                      <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                      <PrimaryButton onClick={() => onChange(values)}>Add issues</PrimaryButton>
                    </div>
                  </>
                ) : (
                  <Combobox value={value} onChange={onChange}>
                    <div className="relative m-1">
                      <MagnifyingGlassIcon
                        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                        aria-hidden="true"
                      />
                      <Combobox.Input
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                        placeholder="Search..."
                        onChange={(e) => setQuery(e.target.value)}
                        displayValue={() => ""}
                      />
                    </div>
                    {customDisplay && <div className="p-3">{customDisplay}</div>}
                    <Combobox.Options
                      static
                      className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                    >
                      {filteredIssues.length > 0 ? (
                        <li className="p-2">
                          {query === "" && (
                            <h2 className="mt-4 mb-2 px-3 text-xs font-semibold text-gray-900">
                              {title}
                            </h2>
                          )}
                          <ul className="text-sm text-gray-700">
                            {filteredIssues.map((issue) => (
                              <Combobox.Option
                                key={issue.id}
                                value={issue.id}
                                className={({ active }) =>
                                  `flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 ${
                                    active ? "bg-gray-900 bg-opacity-5 text-gray-900" : ""
                                  }`
                                }
                                onClick={() => handleClose()}
                              >
                                <>
                                  <span
                                    className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: issue.state_detail.color,
                                    }}
                                  />
                                  <span className="flex-shrink-0 text-xs text-gray-500">
                                    {issue.project_detail?.identifier}-{issue.sequence_id}
                                  </span>{" "}
                                  {issue.name}
                                </>
                              </Combobox.Option>
                            ))}
                          </ul>
                        </li>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-4 px-3 py-8 text-center">
                          <LayerDiagonalIcon height="56" width="56" />
                          <h3 className="text-gray-500">
                            No issues found. Create a new issue with{" "}
                            <pre className="inline rounded bg-gray-200 px-2 py-1">C</pre>.
                          </h3>
                        </div>
                      )}
                    </Combobox.Options>
                  </Combobox>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
