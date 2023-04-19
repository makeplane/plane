import React, { useState } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-hook-form
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// headless ui
import { Combobox, Dialog, Transition } from "@headlessui/react";
// hooks
import useToast from "hooks/use-toast";
import useIssuesView from "hooks/use-issues-view";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
// icons
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// types
import { IIssue } from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
} from "constants/fetch-keys";

type FormInput = {
  issues: string[];
};

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  issues: IIssue[];
  handleOnSubmit: any;
};

export const ExistingIssuesListModal: React.FC<Props> = ({
  isOpen,
  handleClose: onClose,
  issues,
  handleOnSubmit,
}) => {
  const [query, setQuery] = useState("");

  const router = useRouter();
  const { cycleId, moduleId } = router.query;

  const { setToastAlert } = useToast();

  const { params } = useIssuesView();

  const handleClose = () => {
    onClose();
    setQuery("");
    reset();
  };

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting },
  } = useForm<FormInput>({
    defaultValues: {
      issues: [],
    },
  });

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    if (!data.issues || data.issues.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select atleast one issue",
      });

      return;
    }

    await handleOnSubmit(data);
    if (cycleId) {
      mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
      mutate(CYCLE_DETAILS(cycleId as string));
    }
    if (moduleId) {
      mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
      mutate(MODULE_DETAILS(moduleId as string));
    }

    handleClose();

    setToastAlert({
      title: "Success",
      type: "success",
      message: `Issue${data.issues.length > 1 ? "s" : ""} added successfully`,
    });
  };

  const filteredIssues: IIssue[] =
    query === ""
      ? issues ?? []
      : issues.filter((issue) => issue.name.toLowerCase().includes(query.toLowerCase())) ?? [];

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

          <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
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
                <form>
                  <Controller
                    control={control}
                    name="issues"
                    render={({ field }) => (
                      <Combobox as="div" {...field} multiple>
                        <div className="relative m-1">
                          <MagnifyingGlassIcon
                            className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-900 text-opacity-40"
                            aria-hidden="true"
                          />
                          <Combobox.Input
                            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder-gray-500 outline-none focus:ring-0 sm:text-sm"
                            placeholder="Search..."
                            onChange={(e) => setQuery(e.target.value)}
                          />
                        </div>

                        <Combobox.Options
                          static
                          className="max-h-80 scroll-py-2 divide-y divide-gray-500 divide-opacity-10 overflow-y-auto"
                        >
                          {filteredIssues.length > 0 ? (
                            <li className="p-2">
                              {query === "" && (
                                <h2 className="mb-2 px-3 text-xs font-semibold text-gray-900">
                                  Select issues to add
                                </h2>
                              )}
                              <ul className="text-sm text-gray-700">
                                {filteredIssues.map((issue) => (
                                  <Combobox.Option
                                    key={issue.id}
                                    as="label"
                                    htmlFor={`issue-${issue.id}`}
                                    value={issue.id}
                                    className={({ active }) =>
                                      `flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 ${
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
                                          {issue.project_detail.identifier}-{issue.sequence_id}
                                        </span>
                                        {issue.name}
                                      </>
                                    )}
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
                  />
                  {filteredIssues.length > 0 && (
                    <div className="flex items-center justify-end gap-2 p-3">
                      <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
                      <PrimaryButton onClick={handleSubmit(onSubmit)} loading={isSubmitting}>
                        {isSubmitting ? "Adding..." : "Add selected issues"}
                      </PrimaryButton>
                    </div>
                  )}
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
};
