import React, { useEffect, useMemo, useRef, useState } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { Combobox } from "@headlessui/react";
// plane ui
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { SearchIcon, CloseIcon } from "@plane/propel/icons";
import { Checkbox, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
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
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox as="div" multiple value={selectedProjectIds} onChange={handleSelectedProjectChange}>
        <div className="flex items-center gap-2 px-4 border-b border-subtle">
          <SearchIcon className="flex-shrink-0 size-4 text-placeholder" aria-hidden="true" />
          <Combobox.Input
            className="h-12 w-full border-0 bg-transparent text-13 text-primary outline-none placeholder:text-placeholder focus:ring-0"
            placeholder="Search for projects"
            displayValue={() => ""}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {selectedProjectIds.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 px-4">
            {selectedProjectIds.map((projectId) => {
              const projectDetails = projectDetailsMap.get(projectId);
              if (!projectDetails) return null;
              return (
                <div
                  key={projectDetails.id}
                  className="group flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-sm cursor-pointer"
                  onClick={() => {
                    handleSelectedProjectChange(selectedProjectIds.filter((id) => id !== projectDetails.id));
                  }}
                >
                  <Logo logo={projectDetails.logo_props} size={14} />
                  <p className="text-11 truncate text-tertiary group-hover:text-secondary transition-colors">
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
          className="py-2 vertical-scrollbar scrollbar-md max-h-80 scroll-py-2 overflow-y-auto transition-[height] duration-200 ease-in-out"
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
                "px-2": filteredProjectIds.length > 0,
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
                      <span className="flex-shrink-0 text-10">{projectDetails.identifier}</span>
                      <p className="text-13 truncate">{projectDetails.name}</p>
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
          disabled={!areSelectedProjectsChanged}
        >
          {isSubmitting ? t("confirming") : t("confirm")}
        </Button>
      </div>
    </ModalCore>
  );
});
