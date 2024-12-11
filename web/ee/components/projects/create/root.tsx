"use client";

import { useState, FC } from "react";
import { observer } from "mobx-react";
import { useForm, FormProvider } from "react-hook-form";
// ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// types
import { TCreateProjectFormProps } from "@/ce/components/projects/create/root";
// constants
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
import { PROJECT_CREATED } from "@/constants/event-tracker";
import { PROJECT_UNSPLASH_COVERS } from "@/constants/project";
// helpers
import { getRandomEmoji } from "@/helpers/emoji.helper";
// hooks
import { useEventTracker, useMember, useProject, useUser, useWorkspace } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { EUserPermissions } from "@/plane-web/constants/user-permissions";
import { E_FEATURE_FLAGS, useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { TProject } from "@/plane-web/types/projects";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import ProjectAttributes from "./attributes";

const defaultValues: Partial<TProject> = {
  cover_image_url: PROJECT_UNSPLASH_COVERS[Math.floor(Math.random() * PROJECT_UNSPLASH_COVERS.length)],
  description: "",
  logo_props: {
    in_use: "emoji",
    emoji: {
      value: getRandomEmoji(),
    },
  },
  identifier: "",
  name: "",
  network: 2,
  project_lead: null,
};

export const CreateProjectForm: FC<TCreateProjectFormProps> = observer((props) => {
  const { setToFavorite, workspaceSlug, onClose, handleNextStep, data, updateCoverImageStatus } = props;
  // store
  const { captureProjectEvent } = useEventTracker();
  const { addProjectToFavorites, createProject } = useProject();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  const { currentWorkspace } = useWorkspace();
  const {
    memberMap,
    project: { bulkAddMembersToProject },
  } = useMember();
  const { data: currentUser } = useUser();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  const isProjectGroupingEnabled =
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED) &&
    useFlag(workspaceSlug.toString(), E_FEATURE_FLAGS.PROJECT_GROUPING);

  // form info
  const methods = useForm<TProject>({
    defaultValues: { ...defaultValues, ...data },
    reValidateMode: "onChange",
  });
  const {
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setValue,
  } = methods;
  const { isMobile } = usePlatformOS();
  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Couldn't remove the project from favorites. Please try again.",
      });
    });
  };

  const onSubmit = async (formData: Partial<TProject>) => {
    // Upper case identifier
    const members =
      formData.members &&
      formData.members
        .filter((id: any) => currentUser && currentUser.id !== id)
        .map((id: any) => ({
          id,
          member_id: id,
          role: EUserPermissions.MEMBER,
          member__avatar_url: memberMap[id]?.avatar_url,
          member__display_name: memberMap[id]?.display_name,
        }));
    formData.identifier = formData.identifier?.toUpperCase();
    if (members) formData.members = members;
    const coverImage = formData.cover_image_url;

    return createProject(workspaceSlug.toString(), formData)
      .then(async (res) => {
        if (coverImage) {
          await updateCoverImageStatus(res.id, coverImage);
        }
        const newPayload = {
          ...res,
          state: "SUCCESS",
        };
        if (isProjectGroupingEnabled && members) {
          bulkAddMembersToProject(workspaceSlug.toString(), res.id, {
            members,
          });
        }
        captureProjectEvent({
          eventName: PROJECT_CREATED,
          payload: newPayload,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "Project created successfully.",
        });
        if (setToFavorite) {
          handleAddToFavorites(res.id);
        }
        handleNextStep(res.id);
      })
      .catch((err) => {
        Object.keys(err.data).map((key) => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: err.data[key],
          });
          captureProjectEvent({
            eventName: PROJECT_CREATED,
            payload: {
              ...formData,
              state: "FAILED",
            },
          });
        });
      });
  };
  const handleClose = () => {
    onClose();
    setIsChangeInIdentifierRequired(true);
    setTimeout(() => {
      reset();
    }, 300);
  };
  if (!currentWorkspace) return null;
  return (
    <FormProvider {...methods}>
      <div className="p-3">
        <ProjectCreateHeader handleClose={handleClose} />
        <form onSubmit={handleSubmit(onSubmit)} className="px-3">
          <div className="mt-9 space-y-6 pb-5">
            <ProjectCommonAttributes
              setValue={setValue}
              isMobile={isMobile}
              isChangeInIdentifierRequired={isChangeInIdentifierRequired}
              setIsChangeInIdentifierRequired={setIsChangeInIdentifierRequired}
            />
            <ProjectAttributes
              workspaceSlug={workspaceSlug}
              currentWorkspace={currentWorkspace}
              isProjectGroupingEnabled={isProjectGroupingEnabled}
              data={data}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-custom-border-100">
            <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={7}>
              {isSubmitting ? "Creating" : "Create project"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
});
