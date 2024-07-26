"use client";

import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// icons
import { Info, Lock } from "lucide-react";
import { IProject, IWorkspace } from "@plane/types";
// ui
import {
  Button,
  CustomSelect,
  Input,
  TextArea,
  TOAST_TYPE,
  setToast,
  CustomEmojiIconPicker,
  EmojiIconPickerTypes,
  Tooltip,
} from "@plane/ui";
// components
import { Logo } from "@/components/common";
import { ImagePickerPopover } from "@/components/core";
// constants
import { PROJECT_UPDATED } from "@/constants/event-tracker";
import { NETWORK_CHOICES } from "@/constants/project";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { useEventTracker, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { ProjectService } from "@/services/project";
// types
export interface IProjectDetailsForm {
  project: IProject;
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
}
const projectService = new ProjectService();
export const ProjectDetailsForm: FC<IProjectDetailsForm> = (props) => {
  const { project, workspaceSlug, projectId, isAdmin } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
  const { captureProjectEvent } = useEventTracker();
  const { updateProject } = useProject();
  const { isMobile } = usePlatformOS();
  // form info
  const {
    handleSubmit,
    watch,
    control,
    setValue,
    setError,
    reset,
    formState: { errors, dirtyFields },
    getValues,
  } = useForm<IProject>({
    defaultValues: {
      ...project,
      workspace: (project.workspace as IWorkspace).id,
    },
  });

  useEffect(() => {
    if (project && projectId !== getValues("id")) {
      reset({
        ...project,
        workspace: (project.workspace as IWorkspace).id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectId]);
  const handleIdentifierChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const alphanumericValue = value.replace(/[^a-zA-Z0-9]/g, "");
    const formattedValue = alphanumericValue.toUpperCase();
    setValue("identifier", formattedValue);
  };
  const handleUpdateChange = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !project) return;
    return updateProject(workspaceSlug.toString(), project.id, payload)
      .then((res) => {
        const changed_properties = Object.keys(dirtyFields);

        captureProjectEvent({
          eventName: PROJECT_UPDATED,
          payload: {
            ...res,
            changed_properties: changed_properties,
            state: "SUCCESS",
            element: "Project general settings",
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project updated successfully",
        });
      })
      .catch((error) => {
        captureProjectEvent({
          eventName: PROJECT_UPDATED,
          payload: { ...payload, state: "FAILED", element: "Project general settings" },
        });
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? "Project could not be updated. Please try again.",
        });
      });
  };
  const onSubmit = async (formData: IProject) => {
    if (!workspaceSlug) return;
    setIsLoading(true);
    const payload: Partial<IProject> = {
      name: formData.name,
      network: formData.network,
      identifier: formData.identifier,
      description: formData.description,
      cover_image: formData.cover_image,
      logo_props: formData.logo_props,
    };

    if (project.identifier !== formData.identifier)
      await projectService
        .checkProjectIdentifierAvailability(workspaceSlug as string, payload.identifier ?? "")
        .then(async (res) => {
          if (res.exists) setError("identifier", { message: "Identifier already exists" });
          else await handleUpdateChange(payload);
        });
    else await handleUpdateChange(payload);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };
  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === project?.network);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="relative mt-6 h-44 w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <img src={watch("cover_image")!} alt={watch("cover_image")!} className="h-44 w-full rounded-md object-cover" />
        <div className="z-5 absolute bottom-4 flex w-full items-end justify-between gap-3 px-4">
          <div className="flex flex-grow gap-3 truncate">
            <Controller
              control={control}
              name="logo_props"
              render={({ field: { value, onChange } }) => (
                <CustomEmojiIconPicker
                  closeOnSelect={false}
                  isOpen={isOpen}
                  handleToggle={(val: boolean) => setIsOpen(val)}
                  className="flex items-center justify-center"
                  buttonClassName="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-custom-background-90"
                  label={<Logo logo={value} size={28} />}
                  onChange={(val) => {
                    let logoValue = {};

                    if (val?.type === "emoji")
                      logoValue = {
                        value: convertHexEmojiToDecimal(val.value.unified),
                        url: val.value.imageUrl,
                      };
                    else if (val?.type === "icon") logoValue = val.value;

                    onChange({
                      in_use: val?.type,
                      [val?.type]: logoValue,
                    });
                    setIsOpen(false);
                  }}
                  defaultIconColor={value?.in_use && value.in_use === "icon" ? value?.icon?.color : undefined}
                  defaultOpen={
                    value.in_use && value.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                  }
                  disabled={!isAdmin}
                />
              )}
            />
            <div className="flex flex-col gap-1 truncate text-white">
              <span className="truncate text-lg font-semibold">{watch("name")}</span>
              <span className="flex items-center gap-2 text-sm">
                <span>{watch("identifier")} .</span>
                <span className="flex items-center gap-1.5">
                  {project.network === 0 && <Lock className="h-2.5 w-2.5 text-white " />}
                  {currentNetwork?.label}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 justify-center">
            <div>
              <Controller
                control={control}
                name="cover_image"
                render={({ field: { value, onChange } }) => (
                  <ImagePickerPopover
                    label={"Change cover"}
                    control={control}
                    onChange={onChange}
                    value={value}
                    disabled={!isAdmin}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="my-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Project Name</h4>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "Name is required",
              maxLength: {
                value: 255,
                message: "Project name should be less than 255 characters",
              },
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                ref={ref}
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.name)}
                className="rounded-md !p-3 font-medium"
                placeholder="Project Name"
                disabled={!isAdmin}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors?.name?.message}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">Description</h4>
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="description"
                name="description"
                value={value}
                placeholder="Enter project description"
                onChange={onChange}
                className="min-h-[102px] text-sm font-medium"
                hasError={Boolean(errors?.description)}
                disabled={!isAdmin}
              />
            )}
          />
        </div>
        <div className="flex w-full justify-between gap-10">
          <div className="flex w-1/2 flex-col gap-1">
            <h4 className="text-sm">Project ID</h4>
            <div className="relative">
              <Controller
                control={control}
                name="identifier"
                rules={{
                  required: "Project ID is required",
                  validate: (value) =>
                    /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) ||
                    "Only Alphanumeric & Non-latin characters are allowed.",
                  minLength: {
                    value: 1,
                    message: "Project ID must at least be of 1 character",
                  },
                  maxLength: {
                    value: 5,
                    message: "Project ID must at most be of 5 characters",
                  },
                }}
                render={({ field: { value, ref } }) => (
                  <Input
                    id="identifier"
                    name="identifier"
                    type="text"
                    value={value}
                    onChange={handleIdentifierChange}
                    ref={ref}
                    hasError={Boolean(errors.identifier)}
                    placeholder="Enter Project ID"
                    className="w-full font-medium"
                    disabled={!isAdmin}
                  />
                )}
              />
              <Tooltip
                isMobile={isMobile}
                tooltipContent="Helps you identify issues in the project uniquely, (e.g. APP-123). Max 5 characters."
                className="text-sm"
                position="right-top"
              >
                <Info className="absolute right-2 top-2.5 h-4 w-4 text-custom-text-400" />
              </Tooltip>
            </div>
            <span className="text-xs text-red-500">
              <>{errors?.identifier?.message}</>
            </span>
          </div>
          <div className="flex w-1/2 flex-col gap-1">
            <h4 className="text-sm">Network</h4>
            <Controller
              name="network"
              control={control}
              render={({ field: { value, onChange } }) => {
                const selectedNetwork = NETWORK_CHOICES.find((n) => n.key === value);

                return (
                  <CustomSelect
                    value={value}
                    onChange={onChange}
                    label={
                      <div className="flex items-center gap-1">
                        {selectedNetwork ? (
                          <>
                            <selectedNetwork.icon className="h-3.5 w-3.5" />
                            {selectedNetwork.label}
                          </>
                        ) : (
                          <span className="text-custom-text-400">Select network</span>
                        )}
                      </div>
                    }
                    buttonClassName="!border-custom-border-200 !shadow-none font-medium rounded-md"
                    input
                    disabled={!isAdmin}
                    // optionsClassName="w-full"
                  >
                    {NETWORK_CHOICES.map((network) => (
                      <CustomSelect.Option key={network.key} value={network.key}>
                        <div className="flex items-start gap-2">
                          <network.icon className="h-3.5 w-3.5" />
                          <div className="-mt-1">
                            <p>{network.label}</p>
                            <p className="text-xs text-custom-text-400">{network.description}</p>
                          </div>
                        </div>
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                );
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <>
            <Button variant="primary" type="submit" loading={isLoading} disabled={!isAdmin}>
              {isLoading ? "Updating..." : "Update project"}
            </Button>
            <span className="text-sm italic text-custom-sidebar-text-400">
              Created on {renderFormattedDate(project?.created_at)}
            </span>
          </>
        </div>
      </div>
    </form>
  );
};
