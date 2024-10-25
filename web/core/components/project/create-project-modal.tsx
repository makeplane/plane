import { useEffect, FC, useState } from "react";
// plane ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { getAssetIdFromUrl } from "@/helpers/file.helper";
// plane web components
import { CreateProjectForm } from "@/plane-web/components/projects/create/root";
// plane web types
import { TProject } from "@/plane-web/types/projects";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();
import { ProjectFeatureUpdate } from "./project-feature-update";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  setToFavorite?: boolean;
  workspaceSlug: string;
  data?: Partial<TProject>;
};

enum EProjectCreationSteps {
  CREATE_PROJECT = "CREATE_PROJECT",
  FEATURE_SELECTION = "FEATURE_SELECTION",
}

export const CreateProjectModal: FC<Props> = (props) => {
  const { isOpen, onClose, setToFavorite = false, workspaceSlug, data } = props;
  // states
  const [currentStep, setCurrentStep] = useState<EProjectCreationSteps>(EProjectCreationSteps.CREATE_PROJECT);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(EProjectCreationSteps.CREATE_PROJECT);
      setCreatedProjectId(null);
    }
  }, [isOpen]);

  const handleNextStep = (projectId: string) => {
    if (!projectId) return;
    setCreatedProjectId(projectId);
    setCurrentStep(EProjectCreationSteps.FEATURE_SELECTION);
  };

  const handleProjectAssetsStatusUpdate = async (args: { projectId: string; formData: Partial<TProject> }) => {
    const { projectId, formData } = args;
    const { cover_image_url: coverImage, logo_props } = formData;
    const projectLogo = logo_props?.image?.url;
    const assetIds: string[] = [];
    if (coverImage && !coverImage.startsWith("http")) {
      assetIds.push(getAssetIdFromUrl(coverImage));
    }
    if (projectLogo && !projectLogo.startsWith("http")) {
      assetIds.push(getAssetIdFromUrl(projectLogo));
    }
    if (assetIds.length > 0) {
      await fileService.updateBulkProjectAssetsUploadStatus(workspaceSlug, projectId, projectId, {
        asset_ids: assetIds,
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      {currentStep === EProjectCreationSteps.CREATE_PROJECT && (
        <CreateProjectForm
          setToFavorite={setToFavorite}
          workspaceSlug={workspaceSlug}
          onClose={onClose}
          updateProjectAssetsStatus={handleProjectAssetsStatusUpdate}
          handleNextStep={handleNextStep}
          data={data}
        />
      )}
      {currentStep === EProjectCreationSteps.FEATURE_SELECTION && (
        <ProjectFeatureUpdate projectId={createdProjectId} workspaceSlug={workspaceSlug} onClose={onClose} />
      )}
    </ModalCore>
  );
};
