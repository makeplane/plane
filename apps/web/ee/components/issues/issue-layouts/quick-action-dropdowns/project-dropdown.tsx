import React from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { CustomSearchSelect } from "@plane/ui";
// components
import { Logo } from "@/components/common";
// hooks
import { useProject } from "@/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
// plane web types
import { TProject } from "@/plane-web/types";

type ProjectOptionProps = {
  project: TProject;
  isEpicsEnabled: boolean;
  isEpic: boolean;
};

const ProjectOption: React.FC<ProjectOptionProps> = ({ project, isEpicsEnabled, isEpic }) => (
  <div className="flex items-center gap-2 w-full">
    <span className="grid place-items-center flex-shrink-0 h-4 w-4">
      <Logo logo={project.logo_props} size={12} />
    </span>
    <p className="flex-grow truncate flex items-center justify-between gap-3">
      <span>{project.name}</span>
      {!isEpicsEnabled && isEpic && <span className="text-custom-text-400 text-xs">Epics not enabled</span>}
    </p>
  </div>
);

type Props = {
  value: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  currentProjectId?: string;
  isEpic?: boolean;
};

export const ProjectDropdown: React.FC<Props> = observer((props) => {
  const { t } = useTranslation();
  const { value, onChange, placeholder = "Select project", disabled = false, currentProjectId, isEpic = false } = props;

  // store hooks
  const { joinedProjectIds, getProjectById } = useProject();
  const { getProjectFeatures } = useProjectAdvanced();

  const options =
    joinedProjectIds
      ?.reduce<
        Array<{
          value: string;
          query: string;
          content: JSX.Element;
          disabled: boolean;
          isEpicsEnabled: boolean;
        }>
      >((acc, projectId) => {
        const projectDetails = getProjectById(projectId);
        if (!projectDetails || projectId === currentProjectId) return acc;

        const projectFeatures = getProjectFeatures(projectId);
        const isEpicsEnabled = projectFeatures?.is_epic_enabled ?? false;

        acc.push({
          value: projectId,
          query: projectDetails.name,
          content: <ProjectOption project={projectDetails} isEpicsEnabled={isEpicsEnabled} isEpic={isEpic} />,
          disabled: !isEpicsEnabled && isEpic,
          isEpicsEnabled,
        });

        return acc;
      }, [])
      .sort((a, b) => {
        // Sort enabled projects first
        if (a.isEpicsEnabled !== b.isEpicsEnabled) {
          return a.isEpicsEnabled ? -1 : 1;
        }
        // Then sort alphabetically
        return a.query.localeCompare(b.query);
      }) || [];

  const selectedProject = value ? getProjectById(value) : null;

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      label={
        <div className="w-full truncate text-left">
          {selectedProject ? (
            <div className="flex items-center gap-2 truncate">
              <span className="grid place-items-center flex-shrink-0 h-4 w-4">
                <Logo logo={selectedProject.logo_props} size={12} />
              </span>
              <span className="truncate">{selectedProject.name}</span>
            </div>
          ) : (
            <span className="text-custom-text-400">{placeholder}</span>
          )}
        </div>
      }
    />
  );
});
