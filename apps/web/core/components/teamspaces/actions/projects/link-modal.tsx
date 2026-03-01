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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { difference, xor } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Search } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon, TeamsIcon } from "@plane/propel/icons";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn, truncateText } from "@plane/utils";
// assets
import searchProjectDark from "@/app/assets/empty-state/search/project-dark.webp?url";
import searchProjectLight from "@/app/assets/empty-state/search/project-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teamspaceId: string;
  selectedProjectIds: string[];
  projectIds: string[];
  onSubmit: (projectIds: string[]) => Promise<void>;
};

export const LinkProjectModal = observer(function LinkProjectModal(props: Props) {
  const { isOpen, onClose, teamspaceId, selectedProjectIds: selectedProjectIdsProp, projectIds, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmationChecked, setIsConfirmationChecked] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { getProjectById } = useProject();
  const { getTeamspaceById } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const projectDetailsMap = useMemo(
    () => new Map(projectIds.map((id) => [id, getProjectById(id)])),
    [projectIds, getProjectById]
  );
  const areSelectedProjectsChanged = xor(selectedProjectIds, selectedProjectIdsProp).length > 0;
  const newProjectAdditions = difference(selectedProjectIds, selectedProjectIdsProp);
  const hasNewProjectAdditions = newProjectAdditions.length > 0;
  const isButtonDisabled = !areSelectedProjectsChanged || (hasNewProjectAdditions && !isConfirmationChecked);
  const filteredProjectIds = projectIds.filter((id) => {
    const project = projectDetailsMap.get(id);
    const projectQuery = `${project?.identifier} ${project?.name}`.toLowerCase();
    return projectQuery.includes(searchTerm.toLowerCase());
  });
  const filteredProjectResolvedPath = resolvedTheme === "light" ? searchProjectLight : searchProjectDark;

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

  const renderTeamspaceDetails = () => {
    if (!teamspace) return null;

    return (
      <>
        {teamspace.logo_props?.in_use ? (
          <Logo logo={teamspace.logo_props} size={16} />
        ) : (
          <TeamsIcon className="size-4 text-tertiary" />
        )}
        <span className="max-w-[280px] truncate">{teamspace.name}</span>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox as="div" multiple value={selectedProjectIds} onChange={handleSelectedProjectChange}>
        <div className="px-4 pt-3 pb-2">
          <h5 className="flex items-center gap-1.5 text-h5-semibold text-secondary pb-3">
            Link projects to {renderTeamspaceDetails()}
          </h5>
          <div className="flex items-center h-8 px-2 gap-2 border border-subtle-1 rounded">
            <Search className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
            <Combobox.Input
              className="h-full w-full border-0 bg-transparent text-body-xs-regular text-primary outline-none placeholder:text-placeholder focus:ring-0"
              placeholder="Search for projects"
              displayValue={() => ""}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {selectedProjectIds.length > 0 && (
          <div className="flex flex-wrap gap-2 py-2 px-4">
            {selectedProjectIds.map((projectId) => {
              const projectDetails = projectDetailsMap.get(projectId);
              if (!projectDetails) return null;
              return (
                <div
                  key={projectDetails.id}
                  className="group flex items-center gap-1.5 bg-layer-1 px-2 py-1 rounded-sm cursor-pointer"
                  onClick={() => {
                    handleSelectedProjectChange(selectedProjectIds.filter((id) => id !== projectDetails.id));
                  }}
                >
                  <Logo logo={projectDetails.logo_props} size={14} />
                  <p className="text-caption-sm-regular truncate text-tertiary group-hover:text-secondary transition-colors">
                    {projectDetails.identifier}
                  </p>
                  <CloseIcon className="size-3 flex-shrink-0 text-placeholder group-hover:text-secondary transition-colors" />
                </div>
              );
            })}
          </div>
        )}
        <Combobox.Options
          static
          className="pb-2 vertical-scrollbar scrollbar-sm max-h-80 scroll-py-2 overflow-y-auto transition-[height] duration-200 ease-in-out"
        >
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
              className={cn("text-primary", {
                "px-2.5": filteredProjectIds.length > 0,
              })}
            >
              {filteredProjectIds.map((projectId) => {
                const projectDetails = projectDetailsMap.get(projectId);
                if (!projectDetails) return null;
                const isProjectSelected = selectedProjectIds.includes(projectDetails.id);
                return (
                  <Combobox.Option
                    key={projectDetails.id}
                    value={projectDetails.id}
                    className={({ active }) =>
                      cn(
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-secondary transition-colors",
                        {
                          "bg-layer-1": active,
                          "text-primary": isProjectSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex-shrink-0 flex items-center gap-2.5">
                        <Checkbox checked={isProjectSelected} />
                        <Logo logo={projectDetails.logo_props} size={16} />
                      </span>
                      <span className="flex-shrink-0 text-caption-xs-regular">{projectDetails.identifier}</span>
                      <p className="text-body-xs-regular truncate">{projectDetails.name}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            hasNewProjectAdditions
              ? "max-h-20 opacity-100 transform translate-y-0"
              : "max-h-0 opacity-0 transform -translate-y-2"
          )}
        >
          <div
            className="flex items-start gap-2 px-4 py-3 text-body-xs-regular text-secondary bg-layer-1 cursor-pointer"
            onClick={() => setIsConfirmationChecked(!isConfirmationChecked)}
          >
            <Checkbox
              checked={isConfirmationChecked}
              className={cn("flex-shrink-0 mt-[1px]", {
                "bg-surface-1": !isConfirmationChecked,
              })}
            />
            <p className="select-none">
              Grant the <span className="font-semibold">{truncateText(teamspace?.name || "", 100)}</span> teamspace
              access to the selected projects above
            </p>
          </div>
        </div>
      </Combobox>
      <div className="flex items-center justify-end gap-2 p-3 border-t border-subtle">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {t("cancel")}
        </Button>
        <Button
          ref={moveButtonRef}
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isButtonDisabled}
        >
          {isSubmitting ? t("confirming") : t("confirm")}
        </Button>
      </div>
    </ModalCore>
  );
});
