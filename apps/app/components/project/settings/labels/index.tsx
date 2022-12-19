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
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button, Input, Spinner } from "ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels } from "types";
// fetch-keys
import { PROJECT_ISSUE_LABELS } from "constants/fetch-keys";
import SingleLabel from "./single-label";

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

  const editLabel = (label: IIssueLabels) => {
    setNewLabelForm(true);
    setValue("colour", label.colour);
    setValue("name", label.name);
    setIsUpdating(true);
    setLabelidForUpdate(label.id);
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

  return (
    <>
      <section className="space-y-8">
        <div className="md:w-2/3 flex justify-between items-center gap-2">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Labels</h3>
            <p className="mt-4 text-sm text-gray-500">Manage the labels of this project.</p>
          </div>
          <Button
            theme="secondary"
            className="flex items-center gap-x-1"
            onClick={() => setNewLabelForm(true)}
          >
            <PlusIcon className="h-4 w-4" />
            New label
          </Button>
        </div>
        <div className="space-y-5">
          <div
            className={`md:w-2/3 border p-3 rounded-md flex items-center gap-2 ${
              newLabelForm ? "" : "hidden"
            }`}
          >
            <div className="flex-shrink-0 h-8 w-8">
              <Popover className="relative w-full h-full flex justify-center items-center bg-gray-200 rounded-xl">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        open ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {watch("colour") && watch("colour") !== "" && (
                        <span
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: watch("colour") ?? "green",
                          }}
                        ></span>
                      )}
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
                      <Popover.Panel className="absolute top-full z-20 left-0 mt-3 px-2 w-screen max-w-xs sm:px-0">
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
          <>
            {issueLabels ? (
              issueLabels.map((label) => (
                <SingleLabel
                  key={label.id}
                  label={label}
                  issueLabels={issueLabels}
                  editLabel={editLabel}
                  handleLabelDelete={handleLabelDelete}
                />
              ))
            ) : (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
          </>
        </div>
      </section>
    </>
  );
};

export default LabelsSettings;
