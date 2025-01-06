"use client";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useProject } from "@/hooks/store";
import { useProjectLinks } from "@/plane-web/hooks/store";
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
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
  const { handleOnClose, handleLinkOperations, isLinkModalOpen, toggleLinkModal, linkData, setLinkData, fetchLinks } =
    useLinks(workspaceSlug.toString(), projectId.toString());
  const { getLinksByProjectId } = useProjectLinks();
  const { fetchAttachments, getAttachmentsByProjectId } = useProjectAttachments();

  // api calls
  useSWR(
    projectId && workspaceSlug ? `PROJECT_LINKS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchLinks(workspaceSlug.toString(), projectId.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  useSWR(
    projectId && workspaceSlug ? `PROJECT_ATTACHMENTS_${projectId}` : null,
    projectId && workspaceSlug ? () => fetchAttachments(workspaceSlug.toString(), projectId.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  // derived state
  const projectLinks = getLinksByProjectId(projectId.toString());
  const projectAttachments = getAttachmentsByProjectId(projectId.toString());
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
      <div className="w-full h-auto flex overflow-hidden">
        <div className="h-full flex-1 flex flex-col">
          <HeroSection project={project} workspaceSlug={workspaceSlug.toString()} />
          <div className="flex-1 overflow-y-auto px-page-x space-y-4">
            <DescriptionBox
              workspaceSlug={workspaceSlug.toString()}
              project={project}
              handleProjectUpdate={handleUpdateProject}
              toggleLinkModalOpen={toggleLinkModal}
            />
            <StatsToday workspaceSlug={workspaceSlug.toString()} project={project} />
            {projectLinks && projectLinks?.length > 0 && (
              <SectionHeader title="Links" actionButton={<ProjectActionButton setIsModalOpen={toggleLinkModal} />}>
                <ProjectLinkRoot
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                  isModalOpen={isLinkModalOpen}
                  setIsModalOpen={toggleLinkModal}
                />
              </SectionHeader>
            )}
            {projectAttachments && projectAttachments?.length > 0 && (
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
            )}
          </div>
        </div>
        <div className="w-[342px] shadow-md">
          <ProjectDetailsSidebar project={project} />
        </div>
      </div>
    </WithFeatureFlagHOC>
  );
});
