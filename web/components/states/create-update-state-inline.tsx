import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { TwitterPicker } from "react-color";
import { useForm, Controller } from "react-hook-form";
import { Popover, Transition } from "@headlessui/react";
import type { IState } from "@plane/types";
// ui
import { Button, CustomSelect, Input, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// constants
import { STATE_CREATED, STATE_UPDATED } from "@/constants/event-tracker";
import { GROUP_CHOICES } from "@/constants/project";
// hooks
import { useEventTracker, useProjectState } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types

type Props = {
  data: IState | null;
  onClose: () => void;
  groupLength: number;
  selectedGroup: StateGroup | null;
};

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled" | null;

const defaultValues: Partial<IState> = {
  name: "",
  description: "",
  color: "rgb(var(--color-text-200))",
  group: "backlog",
};

export const CreateUpdateStateInline: React.FC<Props> = observer((props) => {
  const { data, onClose, selectedGroup, groupLength } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const { captureProjectStateEvent, setTrackElement } = useEventTracker();
  const { createState, updateState } = useProjectState();
  const { isMobile } = usePlatformOS();
  // form info
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
    control,
  } = useForm<IState>({
    defaultValues,
  });

  /**
   * @description pre-populate form with data if data is present
   */
  useEffect(() => {
    if (!data) return;
    reset(data);
  }, [data, reset]);

  /**
   * @description pre-populate form with default values if data is not present
   */
  useEffect(() => {
    if (data) return;
    reset({
      ...defaultValues,
      group: selectedGroup ?? "backlog",
    });
  }, [selectedGroup, data, reset]);

  const handleClose = () => {
    onClose();
    reset({ name: "", color: "#000000", group: "backlog" });
  };

  const handleCreate = async (formData: IState) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    await createState(workspaceSlug.toString(), projectId.toString(), formData)
      .then((res) => {
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "State created successfully.",
        });
        captureProjectStateEvent({
          eventName: STATE_CREATED,
          payload: {
            ...res,
            state: "SUCCESS",
            element: "Project settings states page",
          },
        });
      })
      .catch((error) => {
        if (error.status === 400)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "State with that name already exists. Please try again with another name.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "State could not be created. Please try again.",
          });

        captureProjectStateEvent({
          eventName: STATE_CREATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Project settings states page",
          },
        });
      });
  };

  const handleUpdate = async (formData: IState) => {
    if (!workspaceSlug || !projectId || !data || isSubmitting) return;

    await updateState(workspaceSlug.toString(), projectId.toString(), data.id, formData)
      .then((res) => {
        handleClose();
        captureProjectStateEvent({
          eventName: STATE_UPDATED,
          payload: {
            ...res,
            state: "SUCCESS",
            element: "Project settings states page",
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "State updated successfully.",
        });
      })
      .catch((error) => {
        if (error.status === 400)
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Another state exists with the same name. Please try again with another name.",
          });
        else
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "State could not be updated. Please try again.",
          });
        captureProjectStateEvent({
          eventName: STATE_UPDATED,
          payload: {
            ...formData,
            state: "FAILED",
            element: "Project settings states page",
          },
        });
      });
  };

  const onSubmit = async (formData: IState) => {
    if (data) await handleUpdate(formData);
    else await handleCreate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-center gap-x-2 rounded-[10px] bg-custom-background-100 py-5"
    >
      <div className="flex-shrink-0">
        <Popover className="relative flex h-full w-full items-center justify-center">
          {({ open }) => (
            <>
              <Popover.Button
                className={`group inline-flex items-center text-base font-medium focus:outline-none ${
                  open ? "text-custom-text-100" : "text-custom-text-200"
                }`}
              >
                {watch("color") && watch("color") !== "" && (
                  <span
                    className="h-5 w-5 rounded"
                    style={{
                      backgroundColor: watch("color") ?? "black",
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
                <Popover.Panel className="absolute left-0 top-full z-20 mt-3 w-screen max-w-xs px-2 sm:px-0">
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
      <Controller
        control={control}
        name="name"
        rules={{
          required: true,
        }}
        render={({ field: { value, onChange, ref } }) => (
          <Input
            id="name"
            name="name"
            type="text"
            value={value}
            onChange={onChange}
            ref={ref}
            hasError={Boolean(errors.name)}
            placeholder="Name"
            className="w-full"
          />
        )}
      />
      {data && (
        <Controller
          name="group"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Tooltip
              tooltipContent={groupLength === 1 ? "Cannot have an empty group." : "Choose State"}
              isMobile={isMobile}
            >
              <div>
                <CustomSelect
                  disabled={groupLength === 1}
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
              </div>
            </Tooltip>
          )}
        />
      )}
      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, ref } }) => (
          <Input
            id="description"
            name="description"
            type="text"
            value={value}
            onChange={onChange}
            ref={ref}
            hasError={Boolean(errors.description)}
            placeholder="Description"
            className="w-full"
          />
        )}
      />
      <Button variant="neutral-primary" onClick={handleClose} size="sm">
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        loading={isSubmitting}
        onClick={() => {
          setTrackElement("PROJECT_SETTINGS_STATE_PAGE");
        }}
        size="sm"
      >
        {data ? (isSubmitting ? "Updating" : "Update") : isSubmitting ? "Creating" : "Create"}
      </Button>
    </form>
  );
});
