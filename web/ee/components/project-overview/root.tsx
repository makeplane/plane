"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useProject } from "@/hooks/store";
import { TProject } from "@/plane-web/types";
import { WithFeatureFlagHOC } from "../feature-flags";
import { ProjectAttachmentRoot } from "./details/attachment";
import { ProjectAttachmentActionButton } from "./details/attachment/quick-action-button";
import { DescriptionBox } from "./details/header/description-box";
import { HeroSection } from "./details/header/hero-section";
import { ProjectLinkRoot } from "./details/links";
import { ProjectLinkCreateUpdateModal } from "./details/links/create-update-link-modal";
import { useLinks } from "./details/links/use-links";
import { ProjectActionButton } from "./details/quick-action-button";
import { SectionHeader } from "./details/section-header";
import { StatsToday } from "./details/stats/root";
import { ProjectDetailsSidebar } from "./sidebar";

export const ProjectOverviewRoot = observer(() => {
  const { projectId, workspaceSlug } = useParams();
  const { getProjectById, updateProject } = useProject();
  const { handleOnClose, handleLinkOperations, isLinkModalOpen, toggleLinkModal, linkData, setLinkData } = useLinks(
    workspaceSlug.toString(),
    projectId.toString()
  );

  // derived state
  const project = getProjectById(projectId.toString());
  if (!project) return null;

  const handleUpdateProject = async (data: Partial<TProject>) => {
    await updateProject(workspaceSlug.toString(), projectId.toString(), data);
  };

  return (
    <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="PROJECT_OVERVIEW" fallback={<></>}>
      <ProjectLinkCreateUpdateModal
        isModalOpen={isLinkModalOpen}
        handleOnClose={handleOnClose}
        linkOperations={handleLinkOperations}
        preloadedData={linkData}
        setLinkData={setLinkData}
      />
      <div className="w-full h-full flex">
        <div className="h-full flex-1 flex flex-col gap-4 overflow-y-scroll pb-6">
          <HeroSection project={project} />
          <div className="px-page-x ">
            <DescriptionBox
              workspaceSlug={workspaceSlug.toString()}
              project={project}
              handleProjectUpdate={handleUpdateProject}
              toggleLinkModalOpen={toggleLinkModal}
            />
            <SectionHeader title="Links" actionButton={<ProjectActionButton setIsModalOpen={toggleLinkModal} />}>
              <ProjectLinkRoot
                workspaceSlug={workspaceSlug.toString()}
                projectId={projectId.toString()}
                isModalOpen={isLinkModalOpen}
                setIsModalOpen={toggleLinkModal}
              />
            </SectionHeader>
            <SectionHeader
              title="Attachments"
              actionButton={
                <ProjectAttachmentActionButton
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                />
              }
            >
              <ProjectAttachmentRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
            </SectionHeader>
            <SectionHeader title="Metrics as of today">
              <StatsToday workspaceSlug={workspaceSlug.toString()} project={project} />
            </SectionHeader>
          </div>
        </div>
        <div className="w-[342px] shadow-md">
          <ProjectDetailsSidebar project={project} />
        </div>
      </div>
    </WithFeatureFlagHOC>
  );
});
