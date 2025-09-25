import { FC, useCallback } from "react";
import { observer } from "mobx-react";
import { FolderOpen, FileText, Users } from "lucide-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TProject } from "@plane/types";
import { Button } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { useTeamspaces, useFlag } from "@/plane-web/hooks/store";
import { useZipImporter } from "@/plane-web/hooks/store/importers/use-zip-importer";
import {
  E_IMPORTER_STEPS,
  TZipImporterProps,
  EDocImporterDestinationType,
} from "@/plane-web/types/importers/zip-importer";
import { StepperNavigation, Dropdown } from "../../../ui";

export const SelectDestination: FC<TZipImporterProps> = observer(({ driverType }) => {
  // hooks
  const { t } = useTranslation();

  const { currentStep, handleStepper, handleImporterData, importerData, handleSyncJobConfig, workspace } =
    useZipImporter(driverType);

  const { joinedProjectIds, getProjectById } = useProject();
  const { joinedTeamSpaceIds, getTeamspaceById, isTeamspacesFeatureEnabled } = useTeamspaces();

  // Feature flags
  const workspaceSlug = workspace?.slug;
  const isTeamspacesEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.TEAMSPACES) && isTeamspacesFeatureEnabled;
  const isWorkspacePagesEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_PAGES);

  // Get current destination config from importer data with fallback based on available options
  const getDefaultDestinationType = useCallback(() => {
    if (isWorkspacePagesEnabled) return EDocImporterDestinationType.WIKI;
    return EDocImporterDestinationType.PROJECT; // Project is always available as fallback
  }, [isWorkspacePagesEnabled]);

  const destinationData = importerData[E_IMPORTER_STEPS.SELECT_DESTINATION]?.destination || {
    type: getDefaultDestinationType(),
  };

  // Destination type options - dynamically filtered based on feature flags
  const destinationTypeOptions = [
    // Wiki option - shown if workspace pages are enabled
    ...(isWorkspacePagesEnabled
      ? [
        {
          key: EDocImporterDestinationType.WIKI,
          label: "Wiki",
          value: EDocImporterDestinationType.WIKI,
          data: { type: EDocImporterDestinationType.WIKI, icon: <FileText className="w-4 h-4" />, label: "Wiki" },
        },
      ]
      : []),
    // Project option - always available
    {
      key: EDocImporterDestinationType.PROJECT,
      label: "Project",
      value: EDocImporterDestinationType.PROJECT,
      data: { type: EDocImporterDestinationType.PROJECT, icon: <FolderOpen className="w-4 h-4" />, label: "Project" },
    },
    // Teamspace option - shown if teamspaces are enabled
    ...(isTeamspacesEnabled
      ? [
        {
          key: EDocImporterDestinationType.TEAMSPACE,
          label: "Teamspace",
          value: EDocImporterDestinationType.TEAMSPACE,
          data: {
            type: EDocImporterDestinationType.TEAMSPACE,
            icon: <Users className="w-4 h-4" />,
            label: "Teamspace",
          },
        },
      ]
      : []),
  ];

  const handleDestinationTypeChange = (destinationType: string | undefined) => {
    if (!destinationType) return;

    let newDestination;
    switch (destinationType) {
      case EDocImporterDestinationType.WIKI:
        newDestination = { type: EDocImporterDestinationType.WIKI as const };
        break;
      case EDocImporterDestinationType.PROJECT:
        // Create incomplete destination object - will be completed when project is selected
        newDestination = {
          type: EDocImporterDestinationType.PROJECT as const,
          project_id: "",
          project_name: "",
        };
        break;
      case EDocImporterDestinationType.TEAMSPACE:
        // Create incomplete destination object - will be completed when teamspace is selected
        newDestination = {
          type: EDocImporterDestinationType.TEAMSPACE as const,
          teamspace_id: "",
          teamspace_name: "",
        };
        break;
      default:
        newDestination = { type: EDocImporterDestinationType.WIKI as const };
    }

    handleImporterData(E_IMPORTER_STEPS.SELECT_DESTINATION, {
      destination: newDestination,
    });
    handleSyncJobConfig("destination", newDestination);
  };

  const handleProjectSelection = (projectId: string | undefined) => {
    if (!projectId) return;

    const project = getProjectById(projectId);
    if (project) {
      const newDestination = {
        type: EDocImporterDestinationType.PROJECT as const,
        project_id: projectId,
        project_name: project.name || "Unknown Project",
      };
      handleImporterData(E_IMPORTER_STEPS.SELECT_DESTINATION, {
        destination: newDestination,
      });
      handleSyncJobConfig("destination", newDestination);
    }
  };

  const handleTeamspaceSelection = (teamspaceId: string | undefined) => {
    if (!teamspaceId) return;

    const teamspace = getTeamspaceById(teamspaceId);
    if (teamspace) {
      const newDestination = {
        type: EDocImporterDestinationType.TEAMSPACE as const,
        teamspace_id: teamspaceId,
        teamspace_name: teamspace.name || "Unknown Teamspace",
      };
      handleImporterData(E_IMPORTER_STEPS.SELECT_DESTINATION, {
        destination: newDestination,
      });
      handleSyncJobConfig("destination", newDestination);
    }
  };

  // Validation
  const isDestinationValid = () => {
    switch (destinationData.type) {
      case EDocImporterDestinationType.WIKI:
        return true;
      case EDocImporterDestinationType.PROJECT:
        return "project_id" in destinationData && !!destinationData.project_id && destinationData.project_id !== "";
      case EDocImporterDestinationType.TEAMSPACE:
        return (
          "teamspace_id" in destinationData && !!destinationData.teamspace_id && destinationData.teamspace_id !== ""
        );
      default:
        return false;
    }
  };

  const handleOnClickNext = async () => {
    if (isDestinationValid()) {
      handleStepper("next");
    }
  };

  // Next button is disabled if destination is not valid
  const isNextButtonDisabled = !isDestinationValid();

  return (
    <div className="w-full space-y-6">
      {/* Destination Selection */}
      <div className="space-y-4">
        <div className="space-y-3">
          {/* Destination Type Dropdown */}
          <div className="space-y-2">
            <div className="text-sm text-custom-text-200">{t(`${driverType}_importer.select_destination.destination_type`)}</div>
            <Dropdown
              dropdownOptions={destinationTypeOptions}
              value={destinationData.type}
              placeHolder={t(`${driverType}_importer.select_destination.select_destination_type`)}
              onChange={(value: string | undefined) => handleDestinationTypeChange(value)}
              iconExtractor={(option) => option.icon}
              queryExtractor={(option) => option.label}
            />
          </div>

          {/* Conditional Project Selection */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${destinationData.type === EDocImporterDestinationType.PROJECT
              ? "max-h-32 opacity-100 transform translate-y-0"
              : "max-h-0 opacity-0 transform -translate-y-2"
              }`}
          >
            <div className="space-y-2 pb-1">
              <div className="text-sm text-custom-text-200">
                {t(`${driverType}_importer.select_destination.select_project`)}
              </div>
              <Dropdown
                dropdownOptions={(joinedProjectIds || []).map((projectId: string) => {
                  const project = getProjectById(projectId);
                  return {
                    key: projectId,
                    label: project?.name || t(`${driverType}_importer.select_destination.unknown_project`),
                    value: projectId,
                    data: project,
                  };
                })}
                disabled={joinedProjectIds.length === 0}
                value={"project_id" in destinationData ? destinationData.project_id : undefined}
                placeHolder={
                  joinedProjectIds.length === 0
                    ? t(`${driverType}_importer.select_destination.no_projects_found`)
                    : t(`${driverType}_importer.select_destination.select_project`)
                }
                onChange={(value: string | undefined) => handleProjectSelection(value)}
                queryExtractor={(option: TProject) => option.name || ""}
              />
            </div>
          </div>

          {/* Conditional Teamspace Selection */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${destinationData.type === EDocImporterDestinationType.TEAMSPACE
              ? "max-h-32 opacity-100 transform translate-y-0"
              : "max-h-0 opacity-0 transform -translate-y-2"
              }`}
          >
            <div className="space-y-2 pb-1">
              <div className="text-sm text-custom-text-200">
                {t(`${driverType}_importer.select_destination.select_teamspace`)}
              </div>
              <Dropdown
                dropdownOptions={(joinedTeamSpaceIds || []).map((teamspaceId: string) => {
                  const teamspace = getTeamspaceById(teamspaceId);
                  return {
                    key: teamspaceId,
                    label: teamspace?.name || t(`${driverType}_importer.select_destination.unknown_teamspace`),
                    value: teamspaceId,
                    data: teamspace,
                  };
                })}
                disabled={joinedTeamSpaceIds.length === 0}
                value={"teamspace_id" in destinationData ? destinationData.teamspace_id : undefined}
                placeHolder={
                  joinedTeamSpaceIds.length === 0
                    ? t(`${driverType}_importer.select_destination.no_teamspaces_found`)
                    : t(`${driverType}_importer.select_destination.select_teamspace`)
                }
                onChange={(value: string | undefined) => handleTeamspaceSelection(value)}
                queryExtractor={(option) => option.name || ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* stepper button */}
      <div className="flex-shrink-0 flex justify-end items-center gap-2 mt-8">
        <StepperNavigation currentStep={currentStep} handleStep={handleStepper}>
          <Button variant="primary" size="sm" onClick={handleOnClickNext} disabled={isNextButtonDisabled}>
            {t(`common.next`)}
          </Button>
        </StepperNavigation>
      </div>
    </div>
  );
});
