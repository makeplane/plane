"use client";

import { useState, FC } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { DEFAULT_PROJECT_FORM_VALUES, PROJECT_EVENT_TRACKER_KEYS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// constants
import ProjectCommonAttributes from "@/components/project/create/common-attributes";
import ProjectCreateHeader from "@/components/project/create/header";
import ProjectCreateButtons from "@/components/project/create/project-create-buttons";
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
  templateId?: string;
  updateCoverImageStatus: (projectId: string, coverImage: string) => Promise<void>;
};

export const CreateProjectForm: FC<TCreateProjectFormProps> = observer((props) => {
  const { setToFavorite, workspaceSlug, data, onClose, handleNextStep, updateCoverImageStatus } = props;
  // store
  const { t } = useTranslation();
  const { captureProjectEvent } = useEventTracker();
  const { addProjectToFavorites, createProject } = useProject();
  // states
  const [isChangeInIdentifierRequired, setIsChangeInIdentifierRequired] = useState(true);
  // form info
  const methods = useForm<TProject>({
    defaultValues: { ...DEFAULT_PROJECT_FORM_VALUES, ...data },
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset, setValue } = methods;
  const { isMobile } = usePlatformOS();
  const handleAddToFavorites = (projectId: string) => {
    if (!workspaceSlug) return;

    addProjectToFavorites(workspaceSlug.toString(), projectId).catch(() => {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("failed_to_remove_project_from_favorites"),
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
          eventName: PROJECT_EVENT_TRACKER_KEYS.create,
          payload: newPayload,
        });
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("project_created_successfully"),
        });
        if (setToFavorite) {
          handleAddToFavorites(res.id);
        }
        handleNextStep(res.id);
      })
      .catch((err) => {
        if (err?.data.code === "PROJECT_NAME_ALREADY_EXIST") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("project_name_already_taken"),
          });
        } else if (err?.data.code === "PROJECT_IDENTIFIER_ALREADY_EXIST") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("project_identifier_already_taken"),
          });
        } else {
          Object.keys(err?.data ?? {}).map((key) => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("error"),
              message: err.data[key],
            });
          });
        }
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
