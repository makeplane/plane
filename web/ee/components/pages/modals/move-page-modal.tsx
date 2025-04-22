import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Check, Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// component types
import { TMovePageModalProps } from "@/ce/components/pages";
// components
import { Logo } from "@/components/common";
import { SimpleEmptyState } from "@/components/empty-state";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// plane web hooks
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
// store
import { ROLE_PERMISSIONS_TO_CREATE_PAGE } from "@/store/pages/project-page.store";

export const MovePageModal: React.FC<TMovePageModalProps> = observer((props) => {
  const { isOpen, onClose, page } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // navigation
  const { workspaceSlug, projectId } = useParams();
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentProjectDetails, getProjectById, joinedProjectIds } = useProject();
  const { movePage } = usePageStore(EPageStoreType.PROJECT);
  // derived values
  const { id } = page;
  const transferrableProjectIds = joinedProjectIds.filter((id) => {
    const projectDetails = getProjectById(id);
    const isCurrentProject = projectDetails?.id === currentProjectDetails?.id;
    const canCurrentUserMovePage =
      !!projectDetails?.member_role && ROLE_PERMISSIONS_TO_CREATE_PAGE.includes(projectDetails?.member_role);
    return !isCurrentProject && canCurrentUserMovePage;
  });
  const filteredProjectIds = transferrableProjectIds.filter((id) => {
    const projectDetails = getProjectById(id);
    const projectQuery = `${projectDetails?.identifier} ${projectDetails?.name}`.toLowerCase();
    return projectQuery.includes(searchTerm.toLowerCase());
  });
  const filteredProjectResolvedPath = useResolvedAssetPath({
    basePath: "/empty-state/search/project",
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedProjectId(null);
    }, 300);
  };

  const handleMovePage = async (newProjectId: string) => {
    if (!workspaceSlug || !projectId || !id) return;
    await movePage({
      workspaceSlug: workspaceSlug.toString(),
      projectId: projectId.toString(),
      pageId: id,
      newProjectId: newProjectId,
    })
      .then(() => {
        handleClose();
        router.push(`/${workspaceSlug}/projects/${newProjectId}/pages/${id}`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Page could not be moved. Please try again later.",
        })
      );
  };

  const handleMove = async () => {
    if (!selectedProjectId) return;
    setIsMoving(true);
    await handleMovePage(selectedProjectId);
    setIsMoving(false);
  };

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox
        as="div"
        value={selectedProjectId}
        onChange={(val: string) => {
          setSelectedProjectId(val);
          setSearchTerm("");
          moveButtonRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 px-4">
          <Search className="flex-shrink-0 size-4 text-custom-text-400" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400 focus:ring-0"
            placeholder="Type to search..."
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Combobox.Options static className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto">
          {filteredProjectIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
              <SimpleEmptyState
                title={t("workspace_projects.empty_state.filter.title")}
                description={t("workspace_projects.empty_state.filter.description")}
                assetPath={filteredProjectResolvedPath}
              />
            </div>
          ) : (
            <ul
              className={cn("text-custom-text-100", {
                "px-2": filteredProjectIds.length > 0,
              })}
            >
              {filteredProjectIds.map((projectId) => {
                const projectDetails = getProjectById(projectId);
                const isProjectSelected = selectedProjectId === projectDetails?.id;
                if (!projectDetails) return null;
                return (
                  <Combobox.Option
                    key={projectDetails.id}
                    value={projectDetails.id}
                    className={({ active }) =>
                      cn(
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-custom-text-200 transition-colors",
                        {
                          "bg-custom-background-80": active,
                          "text-custom-text-100": isProjectSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex-shrink-0 size-4 grid place-items-center">
                        {isProjectSelected ? (
                          <Check className="size-4 text-custom-text-100" />
                        ) : (
                          <Logo logo={projectDetails.logo_props} size={16} />
                        )}
                      </span>
                      <span className="flex-shrink-0 text-[10px]">{projectDetails.identifier}</span>
                      <p className="text-sm truncate">{projectDetails.name}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          ref={moveButtonRef}
          variant="primary"
          size="sm"
          onClick={handleMove}
          loading={isMoving}
          disabled={!selectedProjectId}
        >
          {isMoving ? "Moving" : "Move"}
        </Button>
      </div>
    </ModalCore>
  );
});
