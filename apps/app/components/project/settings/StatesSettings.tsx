import React, { useEffect, useState } from "react";
// swr
import { mutate } from "swr";
// react hook form
import { useForm, Controller } from "react-hook-form";
// react color
import { TwitterPicker } from "react-color";
// headless
import { Popover, Transition } from "@headlessui/react";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateService from "lib/services/state.service";
// components
import ConfirmStateDeletion from "components/project/issues/BoardView/state/confirm-state-delete";
// ui
import { Button, Input } from "ui";
// icons
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// constants
import { addSpaceIfCamelCase, groupBy } from "constants/common";
// types
import type { IState } from "types";

type Props = {
  projectId: string | string[] | undefined;
};

type CreateUpdateStateProps = {
  workspaceSlug?: string;
  projectId?: string;
  data: IState | null;
  onClose: () => void;
  selectedGroup: StateGroup | null;
};

type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled" | null;

const CreateUpdateState: React.FC<CreateUpdateStateProps> = ({
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
    <div className="flex items-center gap-x-2 p-2 bg-white">
      <div className="w-8 h-8 border shrink-0">
        <Popover className="relative w-full h-full flex justify-center items-center">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group bg-white rounded-md inline-flex items-center text-base font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  open ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor: watch("color") ?? "green",
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

const StatesSettings: React.FC<Props> = ({ projectId }) => {
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const { states, activeWorkspace } = useUser();

  const groupedStates: {
    [key: string]: Array<IState>;
  } = groupBy(states ?? [], "group");

  return (
    <>
      <ConfirmStateDeletion
        isOpen={!!selectDeleteState}
        data={states?.find((state) => state.id === selectDeleteState) ?? null}
        onClose={() => setSelectDeleteState(null)}
      />

      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">State</h3>
          <p className="mt-1 text-sm text-gray-500">Manage the state of this project.</p>
        </div>
        <div className="flex flex-col justify-between gap-3">
          {Object.keys(groupedStates).map((key) => (
            <div className="w-full space-y-1" key={key}>
              <div className="flex justify-between">
                <p className="font-medium capitalize">{key} states</p>
                <button type="button" onClick={() => setActiveGroup(key as keyof StateGroup)}>
                  <PlusIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              {groupedStates[key]?.map((state) =>
                state.id !== selectedState ? (
                  <div
                    key={state.id}
                    className="bg-white px-4 py-2 rounded flex justify-between items-center border"
                  >
                    <div className="flex items-center gap-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: state.color,
                        }}
                      ></div>
                      <h4>{addSpaceIfCamelCase(state.name)}</h4>
                    </div>
                    <div className="flex gap-x-2">
                      <button type="button" onClick={() => setSelectDeleteState(state.id)}>
                        <TrashIcon className="h-5 w-5 text-red-400" />
                      </button>
                      <button type="button" onClick={() => setSelectedState(state.id)}>
                        <PencilSquareIcon className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <CreateUpdateState
                    key={state.id}
                    projectId={projectId as string}
                    onClose={() => {
                      setActiveGroup(null);
                      setSelectedState(null);
                    }}
                    workspaceSlug={activeWorkspace?.slug}
                    data={states?.find((state) => state.id === selectedState) ?? null}
                    selectedGroup={key as keyof StateGroup}
                  />
                )
              )}
              {key === activeGroup && (
                <CreateUpdateState
                  projectId={projectId as string}
                  onClose={() => {
                    setActiveGroup(null);
                    setSelectedState(null);
                  }}
                  workspaceSlug={activeWorkspace?.slug}
                  data={null}
                  selectedGroup={key as keyof StateGroup}
                />
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default StatesSettings;
