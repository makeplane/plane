import React, { useEffect } from "react";

import { mutate } from "swr";

// react-hook-form
import { useForm, Controller } from "react-hook-form";
// react-color
import { TwitterPicker } from "react-color";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// services
import stateService from "services/state.service";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Button, CustomSelect, Input } from "components/ui";
// types
import type { IState, StateResponse } from "types";
// fetch-keys
import { STATE_LIST } from "constants/fetch-keys";
// constants
import { GROUP_CHOICES } from "constants/project";

type Props = {
  workspaceSlug?: string;
  projectId?: string;
  data: IState | null;
  onClose: () => void;
  selectedGroup: StateGroup | null;
};

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled" | null;

const defaultValues: Partial<IState> = {
  name: "",
  color: "#000000",
  group: "backlog",
};

export const CreateUpdateStateInline: React.FC<Props> = ({
  workspaceSlug,
  projectId,
  data,
  onClose,
  selectedGroup,
}) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    reset,
    control,
  } = useForm<IState>({
    defaultValues,
  });

  useEffect(() => {
    if (data === null) return;
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    if (!data)
      reset({
        ...defaultValues,
        group: selectedGroup ?? "backlog",
      });
  }, [selectedGroup, data, reset]);

  const handleClose = () => {
    onClose();
    reset({ name: "", color: "#000000", group: "backlog" });
  };

  const onSubmit = async (formData: IState) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;
    const payload: IState = {
      ...formData,
    };
    if (!data) {
      await stateService
        .createState(workspaceSlug, projectId, { ...payload })
        .then((res) => {
          mutate(STATE_LIST(projectId));
          handleClose();

          setToastAlert({
            title: "Success",
            type: "success",
            message: "State created successfully",
          });
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof IState, {
              message: err[key].join(", "),
            });
          });
        });
    } else {
      await stateService
        .updateState(workspaceSlug, projectId, data.id, {
          ...payload,
        })
        .then((res) => {
          mutate(STATE_LIST(projectId));
          handleClose();

          setToastAlert({
            title: "Success",
            type: "success",
            message: "State updated successfully",
          });
        })
        .catch((err) => {
          Object.keys(err).map((key) => {
            setError(key as keyof IState, {
              message: err[key].join(", "),
            });
          });
        });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-x-2 bg-gray-50 p-2">
      <div className="h-8 w-8 flex-shrink-0">
        <Popover className="relative flex h-full w-full items-center justify-center rounded-xl bg-gray-200">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  open ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="h-4 w-4 rounded"
                    style={{
                      backgroundColor: watch("color") ?? "green",
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
                <Popover.Panel className="absolute top-full left-0 z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
                  <Controller
                    name="color"
                    control={control}
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
        register={register}
        autoFocus
        placeholder="Enter state name"
        validations={{
          required: true,
        }}
        error={errors.name}
        autoComplete="off"
      />
      {data && (
        <Controller
          name="group"
          control={control}
          render={({ field: { value, onChange } }) => (
            <CustomSelect
              value={value}
              onChange={onChange}
              label={
                Object.keys(GROUP_CHOICES).find((k) => k === value.toString())
                  ? GROUP_CHOICES[value.toString() as keyof typeof GROUP_CHOICES]
                  : "Select group"
              }
              input
            >
              {Object.keys(GROUP_CHOICES).map((key) => (
                <CustomSelect.Option key={key} value={key}>
                  {GROUP_CHOICES[key as keyof typeof GROUP_CHOICES]}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      )}
      <Input
        id="description"
        name="description"
        register={register}
        placeholder="Enter state description"
        error={errors.description}
        autoComplete="off"
      />
      <Button theme="secondary" onClick={handleClose}>
        Cancel
      </Button>
      <Button theme="primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? (data ? "Updating..." : "Creating...") : data ? "Update" : "Create"}
      </Button>
    </form>
  );
};
