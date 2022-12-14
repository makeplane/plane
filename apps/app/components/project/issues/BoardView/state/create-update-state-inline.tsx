import React, { useEffect } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// react color
import { TwitterPicker } from "react-color";
// headless
import { Popover, Transition } from "@headlessui/react";
// constants
import { GROUP_CHOICES } from "constants/";
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateService from "lib/services/state.service";
// ui
import { Button, Input, Select, Spinner } from "ui";
// types
import type { IState } from "types";

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
          mutate<IState[]>(STATE_LIST(projectId), (prevData) => [...(prevData ?? []), res], false);
          handleClose();
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
          mutate<IState[]>(
            STATE_LIST(projectId),
            (prevData) => {
              const newData = prevData?.map((item) => {
                if (item.id === res.id) {
                  return res;
                }
                return item;
              });
              return newData;
            },
            false
          );
          handleClose();
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

  return (
    <div className="flex items-center gap-x-2 p-2 bg-gray-50">
      <div className="flex-shrink-0 h-8 w-8">
        <Popover className="relative w-full h-full flex justify-center items-center bg-gray-200 rounded-xl">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  open ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="w-4 h-4 rounded"
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
                <Popover.Panel className="absolute top-full z-20 left-0 mt-3 px-2 w-screen max-w-xs sm:px-0">
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
        placeholder="Enter state name"
        validations={{
          required: true,
        }}
        error={errors.name}
        autoComplete="off"
      />
      {data && (
        <Select
          id="group"
          name="group"
          error={errors.group}
          register={register}
          validations={{
            required: true,
          }}
          options={Object.keys(GROUP_CHOICES).map((key) => ({
            value: key,
            label: GROUP_CHOICES[key as keyof typeof GROUP_CHOICES],
          }))}
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
      <Button theme="primary" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
        {isSubmitting ? "Loading..." : data ? "Update" : "Create"}
      </Button>
    </div>
  );
};
