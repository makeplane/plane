"use client";

import { FC, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Info, Lock } from "lucide-react";
import { NETWORK_CHOICES, PROJECT_TRACKER_ELEMENTS, PROJECT_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane types
import { IProject, IWorkspace } from "@plane/types";
// plane ui
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
import { renderFormattedDate, convertHexEmojiToDecimal, getFileURL } from "@plane/utils";
// components
import { Logo } from "@/components/common";
import { ImagePickerPopover } from "@/components/core";
import { TimezoneSelect } from "@/components/global";
import { ProjectNetworkIcon } from "@/components/project";
// helpers
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// services
import { ProjectService } from "@/services/project";

export interface IProjectDetailsForm {
  project: IProject;
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
}
const projectService = new ProjectService();
export const ProjectDetailsForm: FC<IProjectDetailsForm> = (props) => {
  const { project, workspaceSlug, projectId, isAdmin } = props;
  const { t } = useTranslation();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // store hooks
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
    formState: { errors },
    getValues,
  } = useForm<IProject>({
    defaultValues: {
      ...project,
      workspace: (project.workspace as IWorkspace).id,
    },
  });
  // derived values
  const currentNetwork = NETWORK_CHOICES.find((n) => n.key === project?.network);
  const coverImage = watch("cover_image_url");

  useEffect(() => {
    if (project && projectId !== getValues("id")) {
      reset({
        ...project,
        workspace: (project.workspace as IWorkspace).id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, projectId]);

  // handlers
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
        captureSuccess({
          eventName: PROJECT_TRACKER_EVENTS.update,
          payload: {
            id: projectId,
          },
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project_settings.general.toast.success"),
        });
      })
      .catch((err) => {
        try {
          captureError({
            eventName: PROJECT_TRACKER_EVENTS.update,
            payload: {
              id: projectId,
            },
          });

          // Handle the new error format where codes are nested in arrays under field names
          const errorData = err ?? {};

          const nameError = errorData.name?.includes("PROJECT_NAME_ALREADY_EXIST");
          const identifierError = errorData?.identifier?.includes("PROJECT_IDENTIFIER_ALREADY_EXIST");

          if (nameError || identifierError) {
            if (nameError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("project_name_already_taken"),
              });
            }

            if (identifierError) {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: t("toast.error"),
                message: t("project_identifier_already_taken"),
              });
            }
          } else {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("something_went_wrong"),
            });
          }
        } catch (error) {
          // Fallback error handling if the error processing fails
          console.error("Error processing API error:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("something_went_wrong"),
          });
        }
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

      logo_props: formData.logo_props,
      timezone: formData.timezone,
    };
    // if unsplash or a pre-defined image is uploaded, delete the old uploaded asset
    if (formData.cover_image_url?.startsWith("http")) {
      payload.cover_image = formData.cover_image_url;
      payload.cover_image_asset = null;
    }

    if (project.identifier !== formData.identifier)
      await projectService
        .checkProjectIdentifierAvailability(workspaceSlug as string, payload.identifier ?? "")
        .then(async (res) => {
          if (res.exists) setError("identifier", { message: t("common.identifier_already_exists") });
          else await handleUpdateChange(payload);
        });
    else await handleUpdateChange(payload);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="relative h-44 w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <img
          src={getFileURL(
            coverImage ??
              "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
          )}
          alt="Project cover image"
          className="h-44 w-full rounded-md object-cover"
        />
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
                  buttonClassName="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-lg bg-white/10"
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
                  {currentNetwork && t(currentNetwork?.i18n_label)}
                </span>
              </span>
            </div>
          </div>
          <div className="flex flex-shrink-0 justify-center">
            <div>
              <Controller
                control={control}
                name="cover_image_url"
                render={({ field: { value, onChange } }) => (
                  <ImagePickerPopover
                    label={t("change_cover")}
                    control={control}
                    onChange={onChange}
                    value={value ?? null}
                    disabled={!isAdmin}
                    projectId={project.id}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="my-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">{t("common.project_name")}</h4>
          <Controller
            control={control}
            name="name"
            rules={{
              required: t("name_is_required"),
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
                placeholder={t("common.project_name")}
                disabled={!isAdmin}
              />
            )}
          />
          <span className="text-xs text-red-500">{errors?.name?.message}</span>
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="text-sm">{t("description")}</h4>
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                id="description"
                name="description"
                value={value}
                placeholder={t("project_description_placeholder")}
                onChange={onChange}
                className="min-h-[102px] text-sm font-medium"
                hasError={Boolean(errors?.description)}
                disabled={!isAdmin}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm">Project ID</h4>
            <div className="relative">
              <Controller
                control={control}
                name="identifier"
                rules={{
                  required: t("project_id_is_required"),
                  validate: (value) => /^[ÇŞĞIİÖÜA-Z0-9]+$/.test(value.toUpperCase()) || t("project_id_allowed_char"),
                  minLength: {
                    value: 1,
                    message: t("project_id_min_char"),
                  },
                  maxLength: {
                    value: 5,
                    message: t("project_id_max_char"),
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
                    placeholder={t("project_settings.general.enter_project_id")}
                    className="w-full font-medium"
                    disabled={!isAdmin}
                  />
                )}
              />
              <Tooltip
                isMobile={isMobile}
                tooltipContent="Helps you identify work items in the project uniquely. Max 5 characters."
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
          <div className="flex flex-col gap-1">
            <h4 className="text-sm">{t("workspace_projects.network.label")}</h4>
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
                            <ProjectNetworkIcon iconKey={selectedNetwork.iconKey} className="h-3.5 w-3.5" />
                            {t(selectedNetwork.i18n_label)}
                          </>
                        ) : (
                          <span className="text-custom-text-400">{t("select_network")}</span>
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
                          <ProjectNetworkIcon iconKey={network.iconKey} className="h-3.5 w-3.5" />
                          <div className="-mt-1">
                            <p>{t(network.i18n_label)}</p>
                            <p className="text-xs text-custom-text-400">{t(network.description)}</p>
                          </div>
                        </div>
                      </CustomSelect.Option>
                    ))}
                  </CustomSelect>
                );
              }}
            />
          </div>
          <div className="flex flex-col gap-1 col-span-1 sm:col-span-2 xl:col-span-1">
            <h4 className="text-sm">{t("common.project_timezone")}</h4>
            <Controller
              name="timezone"
              control={control}
              rules={{ required: t("project_settings.general.please_select_a_timezone") }}
              render={({ field: { value, onChange } }) => (
                <>
                  <TimezoneSelect
                    value={value}
                    onChange={(value: string) => {
                      onChange(value);
                    }}
                    error={Boolean(errors.timezone)}
                    buttonClassName="border-none"
                  />
                </>
              )}
            />
            {errors.timezone && <span className="text-xs text-red-500">{errors.timezone.message}</span>}
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <>
            <Button
              data-ph-element={PROJECT_TRACKER_ELEMENTS.UPDATE_PROJECT_BUTTON}
              variant="primary"
              type="submit"
              loading={isLoading}
              disabled={!isAdmin}
            >
              {isLoading ? `${t("updating")}...` : t("common.update_project")}
            </Button>
            <span className="text-sm italic text-custom-sidebar-text-400">
              {t("common.created_on")} {renderFormattedDate(project?.created_at)}
            </span>
          </>
        </div>
      </div>
    </form>
  );
};
