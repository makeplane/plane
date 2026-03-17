/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { CustomSearchSelect, Input, Loader, ModalCore } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import type { CursorIntegrationService, CursorProjectMapping } from "@/services/integrations/cursor.service";

interface ProjectMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  cursorService: CursorIntegrationService;
  existingMappings: CursorProjectMapping[];
  editMapping?: CursorProjectMapping | null;
  onSave: (data: { projectId: string; repository: string; ref?: string }) => Promise<void>;
}

export const ProjectMappingModal = ({
  isOpen,
  onClose,
  workspaceId,
  cursorService,
  existingMappings,
  editMapping,
  onSave,
}: ProjectMappingModalProps) => {
  const { workspaceProjectIds, getProjectById } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [selectedRepository, setSelectedRepository] = useState<string | undefined>(undefined);
  const [branch, setBranch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: repositories, isLoading: isLoadingRepos } = useSWR(
    isOpen ? `CURSOR_REPOSITORIES_${workspaceId}` : null,
    () => cursorService.getRepositories(workspaceId),
    { revalidateOnFocus: false, errorRetryCount: 1 }
  );

  // Reset form when modal opens, pre-fill if editing
  useEffect(() => {
    if (isOpen) {
      if (editMapping) {
        setSelectedProjectId(editMapping.project_id);
        setSelectedRepository(editMapping.entity_data.repository);
        setBranch(editMapping.entity_data.ref || "");
      } else {
        setSelectedProjectId(undefined);
        setSelectedRepository(undefined);
        setBranch("");
      }
    }
  }, [isOpen, editMapping]);

  // Filter out already-mapped projects (but include the one being edited)
  const mappedProjectIds = new Set(existingMappings.map((m) => m.project_id));
  const availableProjects = (workspaceProjectIds || [])
    .map((id) => getProjectById(id))
    .filter((p) => p && (!mappedProjectIds.has(p.id) || p.id === editMapping?.project_id));

  // Build project dropdown options
  const projectOptions = availableProjects
    .filter((p) => !!p)
    .map((project) => ({
      value: project.id,
      query: project.name,
      content: (
        <div className="relative flex items-center gap-2 truncate">
          <div className="w-4.5 h-4.5 shrink-0 overflow-hidden relative flex justify-center items-center">
            {project.logo_props ? <Logo logo={project.logo_props} size={14} /> : <ProjectIcon className="w-4 h-4" />}
          </div>
          <div className="grow truncate line-clamp-1">{project.name}</div>
        </div>
      ),
    }));

  // Build repository dropdown options
  const repoOptions = (repositories || []).map((repo) => ({
    value: repo.repository,
    query: repo.repository,
    content: <div className="grow truncate line-clamp-1">{repo.repository}</div>,
  }));

  // Selected project label
  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : undefined;
  const projectLabel = selectedProject ? (
    <div className="relative flex items-center gap-2 truncate">
      <div className="w-4.5 h-4.5 shrink-0 overflow-hidden relative flex justify-center items-center">
        {selectedProject.logo_props ? (
          <Logo logo={selectedProject.logo_props} size={14} />
        ) : (
          <ProjectIcon className="w-4 h-4" />
        )}
      </div>
      <div className="grow truncate line-clamp-1">{selectedProject.name}</div>
    </div>
  ) : (
    "Select a project"
  );

  // Selected repository label
  const repoLabel = selectedRepository ? (
    <div className="relative flex items-center gap-2 truncate">
      <div className="grow truncate line-clamp-1">{selectedRepository}</div>
    </div>
  ) : (
    <div className="relative flex items-center gap-2 truncate">
      <div className="grow truncate line-clamp-1">Select a repository</div>
    </div>
  );

  const handleSubmit = async () => {
    if (!selectedProjectId || !selectedRepository) return;

    setIsSaving(true);
    try {
      await onSave({
        projectId: selectedProjectId,
        repository: selectedRepository,
        ref: branch || undefined,
      });
      onClose();
    } catch {
      // error toast handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = !selectedProjectId || !selectedRepository || isSaving;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <div className="space-y-5 p-5">
        <div className="text-heading-sm-medium text-secondary">
          {editMapping ? "Edit Project Mapping" : "Add Project Mapping"}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-body-xs-regular text-secondary">Project</div>
            <div className="bg-surface-1 rounded-md p-0.5">
              <CustomSearchSelect
                label={projectLabel}
                options={projectOptions}
                value={selectedProjectId}
                onChange={(value: string) => setSelectedProjectId(value)}
                buttonClassName="w-full min-h-8 h-full"
                noChevron
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-body-xs-regular text-secondary">Repository</div>
            {isLoadingRepos ? (
              <Loader>
                <Loader.Item height="32px" width="100%" />
              </Loader>
            ) : repoOptions.length > 0 ? (
              <div className="bg-surface-1 rounded-md p-0.5">
                <CustomSearchSelect
                  label={repoLabel}
                  options={repoOptions}
                  value={selectedRepository}
                  onChange={(value: string) => setSelectedRepository(value)}
                  buttonClassName="w-full min-h-8 h-full"
                  noChevron
                />
              </div>
            ) : (
              <Input
                type="text"
                value={selectedRepository || ""}
                onChange={(e) => setSelectedRepository(e.target.value || undefined)}
                placeholder="owner/repo"
                className="w-full"
              />
            )}
          </div>

          <div className="space-y-1">
            <div className="text-body-xs-regular text-secondary">Branch (optional)</div>
            <Input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full"
            />
          </div>

          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void handleSubmit()} loading={isSaving} disabled={isDisabled}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
};
