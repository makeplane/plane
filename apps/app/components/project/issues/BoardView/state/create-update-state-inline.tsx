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
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateService from "lib/services/state.service";
// ui
import { Button, Input } from "ui";
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
    formState: { errors },
    setError,
    watch,
    reset,
    control,
  } = useForm<IState>({
    defaultValues: {
      name: "",
      color: "#000000",
      group: "backlog",
    },
  });

  const handleClose = () => {
    onClose();
    reset({ name: "", color: "#000000", group: "backlog" });
  };

  const onSubmit = async (formData: IState) => {
    if (!workspaceSlug || !projectId) return;
    const payload: IState = {
      ...formData,
    };
    if (!data) {
      await stateService
        .createState(workspaceSlug, projectId, { ...payload, group: selectedGroup })
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
          group: selectedGroup ?? "backlog",
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
  }, [data]);

  return (
    <div className="flex items-center gap-x-2 p-2 bg-gray-50">
      <div className="w-8 h-8 shrink-0">
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
                <Popover.Panel className="absolute top-full z-50 left-0 mt-3 px-2 w-screen max-w-xs sm:px-0">
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
          required: "Name is required",
        }}
        error={errors.name}
        autoComplete="off"
      />
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
      <Button theme="primary" onClick={handleSubmit(onSubmit)}>
        Save
      </Button>
    </div>
  );
};
