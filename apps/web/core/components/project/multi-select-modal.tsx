/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Combobox, ComboboxItem, ComboboxList, ComboboxSearch } from "@makeplane/propel/components/combobox";
// plane ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { CloseOutline } from "@makeplane/propel/icons";
import { Dialog, DialogActions, DialogContent, DialogMain, DialogTitle } from "@makeplane/propel/components/dialog";
// assets
import darkProjectAsset from "@/app/assets/empty-state/search/project-dark.webp?url";
import lightProjectAsset from "@/app/assets/empty-state/search/project-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectIds: string[];
  projectIds: string[];
  onSubmit: (projectIds: string[]) => Promise<void>;
};

export const ProjectMultiSelectModal = observer(function ProjectMultiSelectModal(props: Props) {
  const { isOpen, onClose, selectedProjectIds: selectedProjectIdsProp, projectIds, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const projectDetailsMap = useMemo(
    () => new Map(projectIds.map((id) => [id, getProjectById(id)])),
    [projectIds, getProjectById]
  );
  const areSelectedProjectsChanged = xor(selectedProjectIds, selectedProjectIdsProp).length > 0;
  const filteredProjectIds = projectIds.filter((id) => {
    const project = projectDetailsMap.get(id);
    const projectQuery = `${project?.identifier} ${project?.name}`.toLowerCase();
    return projectQuery.includes(searchTerm.toLowerCase());
  });
  const filteredProjectResolvedPath = resolvedTheme === "light" ? lightProjectAsset : darkProjectAsset;

  useEffect(() => {
    if (isOpen) setSelectedProjectIds(selectedProjectIdsProp);
  }, [isOpen, selectedProjectIdsProp]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedProjectIds([]);
    }, 300);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(selectedProjectIds);
    setIsSubmitting(false);
    handleClose();
  };

  const handleSelectedProjectChange = (val: string[]) => {
    setSelectedProjectIds(val);
    setSearchTerm("");
    moveButtonRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="sm">
        {/* The search field is the only visible chrome, so the dialog's accessible name is carried
            by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("common.projects")}</DialogTitle>
        </div>
        {/* `inline open` is Base UI's "list without a popup" mode: the dialog is the surface, so the
            list renders in place. Search sits outside DialogMain so its bottom rule runs edge to edge. */}
        <Combobox<string, true>
          inline
          multiple
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          value={selectedProjectIds}
          onValueChange={handleSelectedProjectChange}
          inputValue={searchTerm}
          onInputValueChange={(next, details) => {
            // Base UI clears the query itself after every pick in multiple mode; the pick handler
            // already does that, and letting this through would fight it.
            if (details.reason === "input-clear") return;
            setSearchTerm(next);
          }}
        >
          <ComboboxSearch placeholder="Search for projects" aria-label={t("common.projects")} />
          <DialogMain>
            {selectedProjectIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProjectIds.map((projectId) => {
                  const projectDetails = projectDetailsMap.get(projectId);
                  if (!projectDetails) return null;
                  return (
                    <button
                      type="button"
                      key={projectDetails.id}
                      className="group flex cursor-pointer items-center gap-1.5 rounded-sm bg-surface-2 px-2 py-1"
                      onClick={() => {
                        handleSelectedProjectChange(selectedProjectIds.filter((id) => id !== projectDetails.id));
                      }}
                    >
                      <Logo logo={projectDetails.logo_props} size={14} />
                      <p className="truncate text-11 text-tertiary transition-colors group-hover:text-secondary">
                        {projectDetails.identifier}
                      </p>
                      <CloseOutline className="size-3 flex-shrink-0 text-placeholder transition-colors group-hover:text-secondary" />
                    </button>
                  );
                })}
              </div>
            )}
            <div className="vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain text-primary transition-[height] duration-200 ease-in-out">
              {filteredProjectIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
                  <SimpleEmptyState
                    title={t("workspace_projects.empty_state.filter.title")}
                    description={t("workspace_projects.empty_state.filter.description")}
                    assetPath={filteredProjectResolvedPath}
                  />
                </div>
              ) : (
                <ComboboxList aria-label={t("common.projects")}>
                  {filteredProjectIds.map((projectId) => {
                    const projectDetails = projectDetailsMap.get(projectId);
                    if (!projectDetails) return null;
                    return (
                      // `selection="checkbox"` replaces the hand-placed `Checkbox` the old row drew.
                      <ComboboxItem
                        key={projectDetails.id}
                        value={projectDetails.id}
                        selection="checkbox"
                        label={projectDetails.name}
                        icon={
                          <span className="flex shrink-0 items-center gap-2.5">
                            <Logo logo={projectDetails.logo_props} size={16} />
                            <span className="shrink-0 text-10">{projectDetails.identifier}</span>
                          </span>
                        }
                      />
                    );
                  })}
                </ComboboxList>
              )}
            </div>
          </DialogMain>
        </Combobox>
        <DialogActions>
          <Button variant="secondary" size="md" stretch="auto" label={t("cancel")} onClick={handleClose} />
          <Button
            ref={moveButtonRef}
            variant="primary"
            size="md"
            stretch="auto"
            label={isSubmitting ? t("confirming") : t("confirm")}
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!areSelectedProjectsChanged}
          />
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
});
