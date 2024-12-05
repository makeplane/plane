"use client";

import { useState, FC } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// constants
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
import ProjectCreateButtons from "@/components/project/create/project-create-buttons";
import { PROJECT_CREATED } from "@/constants/event-tracker";
import { PROJECT_UNSPLASH_COVERS } from "@/constants/project";
// helpers
import { getRandomEmoji } from "@/helpers/emoji.helper";
// hooks
import { useEventTracker, useProject } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web types
import { TProject } from "@/plane-web/types/projects";
import ProjectAttributes from "./attributes";

export type TCreateProjectFormProps = {
  setToFavorite?: boolean;
  workspaceSlug: string;
  onClose: () => void;
  handleNextStep: (projectId: string) => void;
  data?: Partial<TProject>;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
};

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
  const { setToFavorite, workspaceSlug, onClose, handleNextStep, updateCoverImageStatus } = props;
  // store
  const { captureProjectEvent } = useEventTracker();
  const { addProjectToFavorites, createProject } = useProject();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  // form info
  const methods = useForm<TProject>({
    defaultValues,
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset, setValue } = methods;
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
    formData.identifier = formData.identifier?.toUpperCase();
    const coverImage = formData.cover_image_url;
    // if unsplash or a pre-defined image is uploaded, delete the old uploaded asset
    if (coverImage?.startsWith("http")) {
      formData.cover_image = coverImage;
      formData.cover_image_asset = null;
    }

    return createProject(workspaceSlug.toString(), formData)
      .then(async (res) => {
        if (coverImage) {
          await updateCoverImageStatus(res.id, coverImage);
        }
        const newPayload = {
          ...res,
          state: "SUCCESS",
        };
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

  return (
    <FormProvider {...methods}>
      <ProjectCreateHeader handleClose={handleClose} isMobile={isMobile} />

      <form onSubmit={handleSubmit(onSubmit)} className="px-3">
        <div className="mt-9 space-y-6 pb-5">
          <ProjectCommonAttributes
            setValue={setValue}
            isMobile={isMobile}
            isChangeInIdentifierRequired={isChangeInIdentifierRequired}
            setIsChangeInIdentifierRequired={setIsChangeInIdentifierRequired}
          />
          <ProjectAttributes isMobile={isMobile} />
        </div>
        <ProjectCreateButtons handleClose={handleClose} />
      </form>
    </FormProvider>
  );
});
