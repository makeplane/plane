import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// react-hook-form
import { Controller, UseFormWatch, useForm } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Listbox, Popover, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// hooks
import useUser from "hooks/use-user";
// ui
import { Input, Spinner } from "components/ui";
// icons
import {
  ChevronDownIcon,
  PlusIcon,
  RectangleGroupIcon,
  TagIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
// types
import { IIssue, IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

type Props = {
  issueDetails: IIssue | undefined;
  issueControl: any;
  watchIssue: UseFormWatch<IIssue>;
  submitChanges: (formData: any) => void;
  isNotAllowed: boolean;
  uneditable: boolean;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  color: "#ff0000",
};

export const SidebarLabelSelect: React.FC<Props> = ({
  issueDetails,
  issueControl,
  watchIssue,
  submitChanges,
  isNotAllowed,
  uneditable,
}) => {
  const [createLabelForm, setCreateLabelForm] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
    control: labelControl,
    setFocus,
  } = useForm<Partial<IIssueLabels>>({
    defaultValues,
  });

  const { user } = useUser();

  const { data: issueLabels, mutate: issueLabelMutate } = useSWR<IIssueLabels[]>(
    workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => issuesService.getIssueLabels(workspaceSlug as string, projectId as string)
      : null
  );

  const handleNewLabel = async (formData: Partial<IIssueLabels>) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    await issuesService
      .createIssueLabel(workspaceSlug as string, projectId as string, formData, user)
      .then((res) => {
        reset(defaultValues);

        issueLabelMutate((prevData: any) => [...(prevData ?? []), res], false);

        submitChanges({ labels_list: [...(issueDetails?.labels ?? []), res.id] });

        setCreateLabelForm(false);
      });
  };

  useEffect(() => {
    if (!createLabelForm) return;

    setFocus("name");
    reset();
  }, [createLabelForm, reset, setFocus]);

  return (
    <div className={`space-y-3 py-3 ${uneditable ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex basis-1/2 items-center gap-x-2 text-sm text-custom-text-200">
          <TagIcon className="h-4 w-4" />
          <p>Label</p>
        </div>
        <div className="basis-1/2">
          <div className="flex flex-wrap gap-1">
            {watchIssue("labels_list")?.map((labelId) => {
              const label = issueLabels?.find((l) => l.id === labelId);

              if (label)
                return (
                  <span
                    key={label.id}
                    className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-100 px-1 py-0.5 text-xs hover:border-red-500/20 hover:bg-red-500/20"
                    onClick={() => {
                      const updatedLabels = watchIssue("labels_list")?.filter((l) => l !== labelId);
                      submitChanges({
                        labels_list: updatedLabels,
                      });
                    }}
                  >
                    <span
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: label?.color && label.color !== "" ? label.color : "#000",
                      }}
                    />
                    {label.name}
                    <XMarkIcon className="h-2 w-2 group-hover:text-red-500" />
                  </span>
                );
            })}
            <Controller
              control={issueControl}
              name="labels_list"
              render={({ field: { value } }) => (
                <Listbox
                  as="div"
                  value={value}
                  onChange={(val: any) => submitChanges({ labels_list: val })}
                  className="flex-shrink-0"
                  multiple
                  disabled={isNotAllowed || uneditable}
                >
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button
                        className={`flex ${
                          isNotAllowed || uneditable
                            ? "cursor-not-allowed"
                            : "cursor-pointer hover:bg-custom-background-90"
                        } items-center gap-2 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs text-custom-text-200`}
                      >
                        Select Label
                      </Listbox.Button>

                      <Transition
                        show={open}
                        as={React.Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-28 w-40 overflow-auto rounded-md bg-custom-background-80 py-1 text-xs shadow-lg border border-custom-border-100 focus:outline-none">
                          <div className="py-1">
                            {issueLabels ? (
                              issueLabels.length > 0 ? (
                                issueLabels.map((label: IIssueLabels) => {
                                  const children = issueLabels?.filter(
                                    (l) => l.parent === label.id
                                  );

                                  if (children.length === 0) {
                                    if (!label.parent)
                                      return (
                                        <Listbox.Option
                                          key={label.id}
                                          className={({ active, selected }) =>
                                            `${
                                              active || selected ? "bg-custom-background-90" : ""
                                            } ${
                                              selected ? "" : "text-custom-text-200"
                                            } flex cursor-pointer select-none items-center gap-2 truncate p-2`
                                          }
                                          value={label.id}
                                        >
                                          <span
                                            className="h-2 w-2 flex-shrink-0 rounded-full"
                                            style={{
                                              backgroundColor:
                                                label.color && label.color !== ""
                                                  ? label.color
                                                  : "#000",
                                            }}
                                          />
                                          {label.name}
                                        </Listbox.Option>
                                      );
                                  } else
                                    return (
                                      <div className="border-y border-custom-border-100 bg-custom-background-90">
                                        <div className="flex select-none items-center gap-2 truncate p-2 font-medium text-custom-text-100">
                                          <RectangleGroupIcon className="h-3 w-3" />
                                          {label.name}
                                        </div>
                                        <div>
                                          {children.map((child) => (
                                            <Listbox.Option
                                              key={child.id}
                                              className={({ active, selected }) =>
                                                `${
                                                  active || selected
                                                    ? "bg-custom-background-100"
                                                    : ""
                                                } ${
                                                  selected ? "" : "text-custom-text-200"
                                                } flex cursor-pointer select-none items-center gap-2 truncate p-2`
                                              }
                                              value={child.id}
                                            >
                                              <span
                                                className="h-2 w-2 flex-shrink-0 rounded-full"
                                                style={{
                                                  backgroundColor: child?.color ?? "black",
                                                }}
                                              />
                                              {child.name}
                                            </Listbox.Option>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                })
                              ) : (
                                <div className="text-center">No labels found</div>
                              )
                            ) : (
                              <Spinner />
                            )}
                          </div>
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              )}
            />
            {!isNotAllowed && (
              <button
                type="button"
                className={`flex ${
                  isNotAllowed || uneditable
                    ? "cursor-not-allowed"
                    : "cursor-pointer hover:bg-custom-background-90"
                } items-center gap-1 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs text-custom-text-200`}
                onClick={() => setCreateLabelForm((prevData) => !prevData)}
                disabled={uneditable}
              >
                {createLabelForm ? (
                  <>
                    <XMarkIcon className="h-3 w-3" /> Cancel
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-3 w-3" /> New
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {createLabelForm && (
        <form className="flex items-center gap-x-2" onSubmit={handleSubmit(handleNewLabel)}>
          <div>
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`flex items-center gap-1 rounded-md bg-custom-background-80 p-1 outline-none focus:ring-2 focus:ring-custom-primary`}
                  >
                    {watch("color") && watch("color") !== "" && (
                      <span
                        className="h-5 w-5 rounded"
                        style={{
                          backgroundColor: watch("color") ?? "black",
                        }}
                      />
                    )}
                    <ChevronDownIcon className="h-3 w-3" />
                  </Popover.Button>

                  <Transition
                    as={React.Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute right-0 bottom-8 z-10 mt-1 max-w-xs transform px-2 sm:px-0">
                      <Controller
                        name="color"
                        control={labelControl}
                        render={({ field: { value, onChange } }) => (
                          <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
                        )}
                      />
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          </div>
          <Input
            id="name"
            name="name"
            placeholder="Title"
            register={register}
            validations={{
              required: "This is required",
            }}
            autoComplete="off"
          />
          <button
            type="button"
            className="grid place-items-center rounded bg-red-500 p-2.5"
            onClick={() => setCreateLabelForm(false)}
          >
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
          <button
            type="submit"
            className="grid place-items-center rounded bg-green-500 p-2.5"
            disabled={isSubmitting}
          >
            <PlusIcon className="h-4 w-4 text-white" />
          </button>
        </form>
      )}
    </div>
  );
};
