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

import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Search } from "lucide-react";
import { InfoIcon } from "@plane/propel/icons";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
// assets
import noResultsDark from "@/app/assets/empty-state/teams/no-results-dark.webp?url";
import noResultsLight from "@/app/assets/empty-state/teams/no-results-light.webp?url";
import noTeamspacesDark from "@/app/assets/empty-state/teams/no-teamspace-dark.webp?url";
import noTeamspacesLight from "@/app/assets/empty-state/teams/no-teamspaces-light.webp?url";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSubmit: (teamspaceIds: string[]) => Promise<void>;
};

type EmptyStateProps = {
  assetPath: string;
  title: string;
  description: string;
};

// TODO: Need to remove this once the new empty state component is merged
function EmptyState(props: EmptyStateProps) {
  const { assetPath, title, description } = props;
  return (
    <div className="text-center flex flex-col items-center text-tertiary">
      <img src={assetPath} alt={title} width={320} height={180} />
      <h3 className={cn("text-body-sm-semibold")}>{title}</h3>
      <p className="text-body-xs-regular whitespace-pre-line">{description}</p>
    </div>
  );
}

export const LinkTeamspaceToProjectModal = observer(function LinkTeamspaceToProjectModal(props: Props) {
  const { isOpen, projectId, onClose, onSubmit } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamspaceIds, setSelectedTeamspaceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // plane hooks
  const { t } = useTranslation();
  // theme hook
  const { resolvedTheme } = useTheme();
  // store hooks
  const { getAvailableTeamspaceIdsForProject, getTeamspaceById } = useTeamspaces();
  // derived values
  const availableTeamspaceIds = getAvailableTeamspaceIdsForProject(projectId);
  const teamspaceDetailsMap = new Map(availableTeamspaceIds.map((id) => [id, getTeamspaceById(id)]));
  const filteredTeamspaceIds = availableTeamspaceIds.filter((id) => {
    const teamspace = teamspaceDetailsMap.get(id);
    return teamspace?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const noTeamspacesResolvedPath = resolvedTheme === "light" ? noTeamspacesLight : noTeamspacesDark;
  const filteredTeamspaceResolvedPath = resolvedTheme === "light" ? noResultsLight : noResultsDark;

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(selectedTeamspaceIds);
    setIsSubmitting(false);
    handleClose();
  };

  const handleSelectedProjectChange = (val: string[]) => {
    setSelectedTeamspaceIds(val);
    setSearchTerm("");
    moveButtonRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setSelectedTeamspaceIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.XL} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox as="div" multiple value={selectedTeamspaceIds} onChange={handleSelectedProjectChange}>
        <div className="flex items-center gap-2 px-4 border-b border-subtle">
          <Search className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-body-xs-regular text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder={t("teamspace_projects.settings.link_teamspace.placeholder")}
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-caption-sm-medium text-tertiary bg-accent-subtle py-2 px-4 flex items-center gap-1">
          <InfoIcon className="flex-shrink-0 size-4" aria-hidden="true" />
          {t("teamspace_projects.settings.link_teamspace.info.title")}{" "}
          <a
            href="https://docs.plane.so/core-concepts/workspaces/teamspaces"
            className="text-accent-secondary underline"
            target="_blank"
            rel="noreferrer"
          >
            {t("teamspace_projects.settings.link_teamspace.info.link")}
          </a>
        </div>
        <Combobox.Options
          static
          className="py-2 vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto transition-[height] duration-200 ease-in-out"
        >
          {availableTeamspaceIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
              <EmptyState
                title={t("teamspace_projects.settings.link_teamspace.empty_state.no_teamspaces.title")}
                description={t("teamspace_projects.settings.link_teamspace.empty_state.no_teamspaces.description")}
                assetPath={noTeamspacesResolvedPath}
              />
            </div>
          ) : filteredTeamspaceIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-3 py-8 text-center">
              <EmptyState
                title={t("teamspace_projects.settings.link_teamspace.empty_state.no_results.title")}
                description={t("teamspace_projects.settings.link_teamspace.empty_state.no_results.description")}
                assetPath={filteredTeamspaceResolvedPath}
              />
            </div>
          ) : (
            <ul
              className={cn("text-primary", {
                "px-2": filteredTeamspaceIds.length > 0,
              })}
            >
              {filteredTeamspaceIds.map((teamspaceId) => {
                const teamspaceDetails = teamspaceDetailsMap.get(teamspaceId);
                if (!teamspaceDetails) return null;
                const isTeamspaceSelected = selectedTeamspaceIds.includes(teamspaceDetails.id);
                return (
                  <Combobox.Option
                    key={teamspaceDetails.id}
                    value={teamspaceDetails.id}
                    className={({ active }) =>
                      cn(
                        "flex items-center justify-between gap-2 truncate w-full cursor-pointer select-none rounded-md p-2 text-secondary transition-colors",
                        {
                          "bg-layer-1": active,
                          "text-primary": isTeamspaceSelected,
                        }
                      )
                    }
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="flex-shrink-0 flex items-center gap-2.5">
                        <Checkbox checked={isTeamspaceSelected} />
                        <Logo logo={teamspaceDetails.logo_props} size={14.4} />
                      </span>
                      <p className="text-body-xs-regular truncate">{teamspaceDetails.name}</p>
                    </div>
                  </Combobox.Option>
                );
              })}
            </ul>
          )}
        </Combobox.Options>
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
          disabled={!selectedTeamspaceIds.length}
        >
          {isSubmitting ? t("confirming") : t("teamspace_projects.settings.link_teamspace.primary_button.text")}
        </Button>
      </div>
    </ModalCore>
  );
});
