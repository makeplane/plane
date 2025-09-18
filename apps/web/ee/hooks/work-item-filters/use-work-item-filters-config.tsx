// plane imports
import { useMemo } from "react";
import { Briefcase } from "lucide-react";
import { LayersIcon } from "@plane/propel/icons";
import { IIssueType, IProject, TWorkItemFilterProperty } from "@plane/types";
import { Logo } from "@plane/ui";
import { getTeamspaceProjectFilterConfig, getWorkItemTypeFilterConfig } from "@plane/utils";
// ce imports
import { useFiltersOperatorConfigs } from "@/ce/hooks/rich-filters/use-filters-operator-configs";
import {
  TWorkItemFiltersEntityProps as TCoreWorkItemFiltersEntityProps,
  TUseWorkItemFiltersConfigProps as TCoreUseWorkItemFiltersConfigProps,
  TWorkItemFiltersConfig,
  useWorkItemFiltersConfig as useCoreWorkItemFiltersConfig,
} from "@/ce/hooks/work-item-filters/use-work-item-filters-config";
// plane web imports
import { useProject } from "@/hooks/store/use-project";
import { IssueTypeLogo } from "@/plane-web/components/issue-types/common/issue-type-logo";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types";

export type TWorkItemFiltersEntityProps = TCoreWorkItemFiltersEntityProps & {
  workItemTypeIds?: string[];
  teamspaceProjectIds?: string[];
};

export type TUseWorkItemFiltersConfigProps = TCoreUseWorkItemFiltersConfigProps & TWorkItemFiltersEntityProps;

export const useWorkItemFiltersConfig = (props: TUseWorkItemFiltersConfigProps): TWorkItemFiltersConfig => {
  const { workItemTypeIds, teamspaceProjectIds, workspaceSlug } = props;
  // store hooks
  const { getIssueTypeById } = useIssueTypes();
  const { getProjectById } = useProject();
  // derived values
  const { configs, configMap, isFilterEnabled } = useCoreWorkItemFiltersConfig(props);
  const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug });
  const workItemTypes: IIssueType[] | undefined = workItemTypeIds
    ? (workItemTypeIds
        .map((workItemTypeId) => getIssueTypeById(workItemTypeId))
        .filter((workItemType) => workItemType) as IIssueType[])
    : undefined;
  const teamspaceProjects = useMemo(
    () =>
      teamspaceProjectIds
        ? (teamspaceProjectIds.map((projectId) => getProjectById(projectId)).filter((project) => project) as IProject[])
        : [],
    [teamspaceProjectIds, getProjectById]
  );

  // work item type filter config
  const workItemTypeFilterConfig = useMemo(
    () =>
      getWorkItemTypeFilterConfig<TWorkItemFilterProperty>("type_id")({
        isEnabled: isFilterEnabled("type_id") && workItemTypes !== undefined,
        filterIcon: LayersIcon,
        getOptionIcon: (issueType) => (
          <IssueTypeLogo icon_props={issueType?.logo_props?.icon} isDefault={issueType?.is_default} size="xs" />
        ),
        workItemTypes: workItemTypes ?? [],
        ...operatorConfigs,
      }),
    [isFilterEnabled, workItemTypes, operatorConfigs]
  );

  // teamspace project filter config
  const teamspaceProjectFilterConfig = useMemo(
    () =>
      getTeamspaceProjectFilterConfig<TWorkItemFilterProperty>("team_project_id")({
        isEnabled: isFilterEnabled("team_project_id") && teamspaceProjects !== undefined,
        filterIcon: Briefcase,
        projects: teamspaceProjects,
        getOptionIcon: (project) => <Logo logo={project.logo_props} size={12} />,
        ...operatorConfigs,
      }),
    [isFilterEnabled, teamspaceProjects, operatorConfigs]
  );

  return {
    configs: [workItemTypeFilterConfig, teamspaceProjectFilterConfig, ...configs], // We can re-order the configs using configMap if needed
    configMap: { ...configMap, type_id: workItemTypeFilterConfig, team_project_id: teamspaceProjectFilterConfig },
    isFilterEnabled,
  };
};
