import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { TwitterPicker } from "react-color";
import { Popover, Transition } from "@headlessui/react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Input } from "@plane/ui";
import { IssueLabelSelect } from "../select";
// icons
import { Plus, X } from "lucide-react";
// types
import { IIssue, IIssueLabel } from "types";

type Props = {
  issueDetails: IIssue | undefined;
  labelList: string[];
  submitChanges: (formData: any) => void;
  isNotAllowed: boolean;
  uneditable: boolean;
};

const defaultValues: Partial<IIssueLabel> = {
  name: "",
  color: "#ff0000",
};

export const SidebarLabelSelect: React.FC<Props> = observer((props) => {
  const { issueDetails, labelList, submitChanges, isNotAllowed, uneditable } = props;
  // states
  const [createLabelForm, setCreateLabelForm] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast
  const { setToastAlert } = useToast();
  // mobx store
  const {
    projectLabel: { projectLabels, createLabel },
  } = useMobxStore();
  // form info
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setFocus,
  } = useForm<Partial<IIssueLabel>>({
    defaultValues,
  });

  const handleNewLabel = async (formData: Partial<IIssueLabel>) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    await createLabel(workspaceSlug.toString(), projectId.toString(), formData)
      .then((res) => {
        reset(defaultValues);

        submitChanges({ labels: [...(issueDetails?.labels ?? []), res.id] });

        setCreateLabelForm(false);
      })
      .catch((error) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: error?.error ?? "Something went wrong. Please try again.",
        });
        reset(formData);
      });
  };

  useEffect(() => {
    if (!createLabelForm) return;

    setFocus("name");
    reset();
  }, [createLabelForm, reset, setFocus]);

  return (
    <div className={`flex flex-col gap-3 ${uneditable ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap gap-1">
        {labelList?.map((labelId) => {
          const label = projectLabels?.find((l) => l.id === labelId);

          if (label)
            return (
              <span
                key={label.id}
                className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-100 px-1 py-0.5 text-xs hover:border-red-500/20 hover:bg-red-500/20"
                onClick={() => {
                  const updatedLabels = labelList?.filter((l) => l !== labelId);
                  submitChanges({
                    labels: updatedLabels,
                  });
                }}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: label.color ?? "#000000",
                  }}
                />
                {label.name}
                <X className="h-2 w-2 group-hover:text-red-500" />
              </span>
            );
        })}
        <IssueLabelSelect
          setIsOpen={setCreateLabelForm}
          value={issueDetails?.labels ?? []}
          onChange={(val: any) => submitChanges({ labels: val })}
          projectId={issueDetails?.project_detail.id ?? ""}
          label={
            <span
              className={`flex ${
                isNotAllowed || uneditable ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-90"
              } items-center gap-2 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs hover:text-custom-text-200 text-custom-text-300`}
            >
              Select Label
            </span>
          }
        />
        {!isNotAllowed && (
          <button
            type="button"
            className={`flex ${
              isNotAllowed || uneditable ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-90"
            } items-center gap-1 rounded-2xl border border-custom-border-100 px-2 py-0.5 text-xs hover:text-custom-text-200 text-custom-text-300`}
            onClick={() => setCreateLabelForm((prevData) => !prevData)}
            disabled={uneditable}
          >
            {createLabelForm ? (
              <>
                <X className="h-3 w-3" /> Cancel
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" /> New
              </>
            )}
          </button>
        )}
      </div>

      {createLabelForm && (
        <form className="flex items-center gap-x-2" onSubmit={handleSubmit(handleNewLabel)}>
          <div>
            <Controller
              name="color"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Popover className="relative">
                  <>
                    <Popover.Button className="grid place-items-center outline-none">
                      {value && value?.trim() !== "" && (
                        <span
                          className="h-6 w-6 rounded"
                          style={{
                            backgroundColor: value ?? "black",
                          }}
                        />
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
                      <Popover.Panel className="absolute z-10 mt-1.5 max-w-xs px-2 sm:px-0">
                        <TwitterPicker color={value} onChange={(value) => onChange(value.hex)} />
                      </Popover.Panel>
                    </Transition>
                  </>
                </Popover>
              )}
            />
          </div>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "This is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value ?? ""}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.name)}
                placeholder="Title"
                className="w-full"
              />
            )}
          />
          <button
            type="button"
            className="grid place-items-center rounded bg-red-500 p-2.5"
            onClick={() => setCreateLabelForm(false)}
          >
            <X className="h-4 w-4 text-white" />
          </button>
          <button type="submit" className="grid place-items-center rounded bg-green-500 p-2.5" disabled={isSubmitting}>
            <Plus className="h-4 w-4 text-white" />
          </button>
        </form>
      )}
    </div>
  );
});
