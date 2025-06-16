import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { EUserPermissionsLevel, EUserProjectRoles, PROJECT_UPDATED } from "@plane/constants";
import { IProject, IWorkspace } from "@plane/types";
import { CustomEmojiIconPicker, EmojiIconPickerTypes, Logo, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { convertHexEmojiToDecimal, getFileURL } from "@plane/utils";
import { ImagePickerPopover } from "@/components/core";
// helpers
// hooks
import { useEventTracker, useProject, useUserPermissions } from "@/hooks/store";
// plane web imports
import { TProject } from "@/plane-web/types";

type THeroSection = {
  project: TProject;
  workspaceSlug: string;
};

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1672243775941-10d763d9adef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";

export const HeroSection = observer((props: THeroSection) => {
  const { project, workspaceSlug } = props;
  const [isOpen, setIsOpen] = useState(false);
  const { allowPermissions } = useUserPermissions();
  const { captureProjectEvent } = useEventTracker();
  const { updateProject } = useProject();
  // form info
  const {
    handleSubmit,
    control,
    formState: { dirtyFields },
    getValues,
  } = useForm<IProject>({
    defaultValues: {
      ...project,
      workspace: (project.workspace as IWorkspace).id,
    },
  });

  // derived values
  const isAdmin = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project.id.toString()
  );

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
  const onSubmit = async () => {
    if (!workspaceSlug) return;
    const payload: Partial<IProject> = {
      logo_props: getValues<"logo_props">("logo_props"),
    };

    handleUpdateChange(payload);
  };

  const handleCoverChange = async (payload: Partial<IProject>) => {
    if (!workspaceSlug || !project) return;
    return updateProject(workspaceSlug.toString(), project.id, payload);
  };

  return (
    <div>
      <div className="relative h-[118px] w-full ">
        <img
          src={getFileURL(project.cover_image ?? DEFAULT_COVER_IMAGE)}
          alt={project.name}
          className="absolute left-0 top-0 h-full w-full object-cover"
        />
        {isAdmin && (
          <div className="absolute right-4 top-4">
            <ImagePickerPopover
              label="Change cover"
              control={control}
              onChange={(data) => {
                if (data === project.cover_image) return;
                handleCoverChange({ cover_image: data });
              }}
              value={project.cover_image ?? DEFAULT_COVER_IMAGE}
              disabled={!isAdmin}
              projectId={project.id}
            />
          </div>
        )}
      </div>
      <div className="relative px-10 pt-page-y mt-2">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="absolute -top-[27px] h-10 w-10 flex-shrink-0 grid place-items-center rounded bg-custom-background-80"
        >
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
              <CustomEmojiIconPicker
                closeOnSelect={false}
                isOpen={isOpen}
                handleToggle={(val: boolean) => setIsOpen(val)}
                className="flex items-center justify-center"
                buttonClassName="flex flex-shrink-0 items-center justify-center rounded-lg bg-white/10"
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
                  onSubmit();
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
        </form>
        <div className="font-bold text-xl">{project.name}</div>
      </div>
    </div>
  );
});
