// react
import React, { useState } from "react";
// swr
import useSWR from "swr";
// react-hook-form
import { Controller, SubmitHandler, useForm } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// services
import issuesServices from "lib/services/issues.service";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
import { Popover, Transition, Menu } from "@headlessui/react";
// ui
import { Button, Input, Spinner } from "ui";
// icons
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";
// types
import { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  colour: "#ff0000",
};

const LabelsSettings: React.FC = () => {
  const [newLabelForm, setNewLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelIdForUpdate, setLabelidForUpdate] = useState<string | null>(null);

  const { activeWorkspace, activeProject } = useUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<IIssueLabels>({ defaultValues });

  const { data: issueLabels, mutate } = useSWR<IIssueLabels[]>(
    activeProject && activeWorkspace ? PROJECT_ISSUE_LABELS(activeProject.id) : null,
    activeProject && activeWorkspace
      ? () => issuesServices.getIssueLabels(activeWorkspace.slug, activeProject.id)
      : null
  );

  const handleNewLabel: SubmitHandler<IIssueLabels> = (formData) => {
    if (!activeWorkspace || !activeProject || isSubmitting) return;
    issuesServices
      .createIssueLabel(activeWorkspace.slug, activeProject.id, formData)
      .then((res) => {
        console.log(res);
        reset(defaultValues);
        mutate((prevData) => [...(prevData ?? []), res], false);
        setNewLabelForm(false);
      });
  };

  const handleLabelUpdate: SubmitHandler<IIssueLabels> = (formData) => {
    if (!activeWorkspace || !activeProject || isSubmitting) return;
    issuesServices
      .patchIssueLabel(activeWorkspace.slug, activeProject.id, labelIdForUpdate ?? "", formData)
      .then((res) => {
        console.log(res);
        reset(defaultValues);
        mutate(
          (prevData) =>
            prevData?.map((p) => (p.id === labelIdForUpdate ? { ...p, ...formData } : p)),
          false
        );
        setNewLabelForm(false);
      });
  };

  const handleLabelDelete = (labelId: string) => {
    if (activeWorkspace && activeProject) {
      mutate((prevData) => prevData?.filter((p) => p.id !== labelId), false);
      issuesServices
        .deleteIssueLabel(activeWorkspace.slug, activeProject.id, labelId)
        .then((res) => {
          console.log(res);
        })
        .catch((e) => {
          console.log(e);
        });
    }
  };

  const getLabelChildren = (labelId: string) => {
    return issueLabels?.filter((l) => l.parent === labelId);
  };

  return (
    <>
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Labels</h3>
            <p className="mt-1 text-sm text-gray-500">Manage the labels of this project.</p>
          </div>
          <Button className="flex items-center gap-x-1" onClick={() => setNewLabelForm(true)}>
            <PlusIcon className="h-4 w-4" />
            New label
          </Button>
        </div>
        <div className="space-y-5">
          <div
            className={`bg-white px-4 py-2 flex items-center gap-2 ${newLabelForm ? "" : "hidden"}`}
          >
            <div>
              <Popover className="relative">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`bg-white flex items-center gap-1 rounded-md p-1 outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      {watch("colour") && watch("colour") !== "" && (
                        <span
                          className="w-6 h-6 rounded"
                          style={{
                            backgroundColor: watch("colour") ?? "green",
                          }}
                        ></span>
                      )}
                      <ChevronDownIcon className="h-4 w-4" />
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
                      <Popover.Panel className="absolute z-20 transform left-0 mt-1 px-2 max-w-xs sm:px-0">
                        <Controller
                          name="colour"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TwitterPicker
                              color={value}
                              onChange={(value) => onChange(value.hex)}
                            />
                          )}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
            <div className="w-full flex flex-col justify-center">
              <Input
                type="text"
                id="labelName"
                name="name"
                register={register}
                placeholder="Lable title"
                validations={{
                  required: "Label title is required",
                }}
                error={errors.name}
              />
            </div>
            <Button type="button" theme="secondary" onClick={() => setNewLabelForm(false)}>
              Cancel
            </Button>
            {isUpdating ? (
              <Button
                type="button"
                onClick={handleSubmit(handleLabelUpdate)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating" : "Update"}
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit(handleNewLabel)} disabled={isSubmitting}>
                {isSubmitting ? "Adding" : "Add"}
              </Button>
            )}
          </div>
          {issueLabels ? (
            issueLabels.map((label) => {
              const children = getLabelChildren(label.id);

              return (
                <React.Fragment key={label.id}>
                  {children && children.length === 0 ? (
                    <div className="bg-white p-2 flex items-center justify-between text-gray-900 rounded-md">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex-shrink-0 h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: label.colour,
                          }}
                        />
                        <p className="text-sm">{label.name}</p>
                      </div>
                      <div>
                        <Menu as="div" className="relative">
                          <Menu.Button
                            as="button"
                            className={`h-7 w-7 p-1 grid place-items-center rounded hover:bg-gray-100 duration-300 outline-none`}
                          >
                            <EllipsisHorizontalIcon className="h-4 w-4" />
                          </Menu.Button>
                          <Menu.Items className="absolute origin-top-right right-0.5 mt-1 p-1 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <Menu.Item>
                              <button
                                type="button"
                                className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                onClick={() => {
                                  setNewLabelForm(true);
                                  setValue("colour", label.colour);
                                  setValue("name", label.name);
                                  setIsUpdating(true);
                                  setLabelidForUpdate(label.id);
                                }}
                              >
                                Edit
                              </button>
                            </Menu.Item>
                            <Menu.Item>
                              <div className="hover:bg-gray-100 border-b last:border-0">
                                <button
                                  type="button"
                                  className="text-left p-2 text-gray-900 hover:bg-theme hover:text-white rounded-md text-xs whitespace-nowrap w-full"
                                  onClick={() => handleLabelDelete(label.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white p-4 text-gray-900 rounded-md">
                      <h3 className="font-medium leading-5 flex items-center gap-2">
                        <RectangleGroupIcon className="h-5 w-5" />
                        This is the label group title
                      </h3>
                      <div className="pl-5 mt-4">
                        <div className="group text-sm flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                          <h5 className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            This is the label title
                          </h5>
                          <button type="button" className="hidden group-hover:block">
                            <PencilIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default LabelsSettings;
