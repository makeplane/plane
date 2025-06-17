import { ExIssueProperty, ExIssueType, ExIssuePropertyOption, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { logger } from "@/logger";

type TCreateOrUpdateIssueProperties = {
  jobId: string;
  issueTypesMap: Map<string, ExIssueType>;
  defaultIssueType: ExIssueType | undefined;
  issueProperties: Partial<ExIssueProperty>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

type TCreateOrUpdateIssuePropertiesOptions = {
  jobId: string;
  issuePropertyMap: Map<string, ExIssueProperty>;
  issuePropertiesOptions: Partial<ExIssuePropertyOption>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

export const createOrUpdateIssueProperties = async (
  props: TCreateOrUpdateIssueProperties
): Promise<ExIssueProperty[]> => {
  const { jobId, issueTypesMap, defaultIssueType, issueProperties, planeClient, workspaceSlug, projectId, method } =
    props;

  // Process a single issue property
  const processIssueProperty = async (issueProperty: Partial<ExIssueProperty>): Promise<ExIssueProperty | null> => {
    try {
      const issueType = issueTypesMap.get(issueProperty.type_id || "") || defaultIssueType;
      if (!issueType) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue type not found for the issue property: ${issueProperty.display_name}`
        );
        return null;
      }

      let createdUpdatedIssueProperty: ExIssueProperty | undefined;

      if (method === "create") {
        createdUpdatedIssueProperty = await protect(
          planeClient.issueProperty.create.bind(planeClient.issueProperty),
          workspaceSlug,
          projectId,
          issueType.id,
          issueProperty
        );
      } else {
        createdUpdatedIssueProperty = await protect(
          planeClient.issueProperty.update.bind(planeClient.issueProperty),
          workspaceSlug,
          projectId,
          issueType.id,
          issueProperty.id,
          issueProperty
        );
      }

      return createdUpdatedIssueProperty;
    } catch (error) {
      logger.error(
        `[${jobId.slice(0, 7)}] Error while ${method === "create" ? "creating" : "updating"} the issue property: ${issueProperty.display_name}`,
        error
      );
      return null;
    }
  };

  // Process all issue properties in batches of 5
  const createdUpdatedIssueProperties = await processBatchPromises(issueProperties, processIssueProperty, 5);

  return createdUpdatedIssueProperties;
};

export const createOrUpdateIssuePropertiesOptions = async (
  props: TCreateOrUpdateIssuePropertiesOptions
): Promise<ExIssuePropertyOption[]> => {
  const { jobId, issuePropertyMap, issuePropertiesOptions, planeClient, workspaceSlug, projectId, method } = props;

  const processIssuePropertyOption = async (
    issuePropertyOption: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption | null> => {
    let createdUpdatedIssuePropertyOption: ExIssuePropertyOption | undefined;
    try {
      const issueProperty = issuePropertyMap.get(issuePropertyOption.property_id || "");
      if (!issueProperty) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue property not found for the issue property option: ${issuePropertyOption.name}`
        );
        return null;
      }

      if (method === "create") {
        createdUpdatedIssuePropertyOption = await protect(
          planeClient.issuePropertyOption.create.bind(planeClient.issuePropertyOption),
          workspaceSlug,
          projectId,
          issueProperty.id,
          issuePropertyOption
        );
      } else {
        createdUpdatedIssuePropertyOption = await protect(
          planeClient.issuePropertyOption.update.bind(planeClient.issuePropertyOption),
          workspaceSlug,
          projectId,
          issueProperty.id,
          issuePropertyOption.id,
          issuePropertyOption
        );
      }

      return createdUpdatedIssuePropertyOption;
    } catch (error) {
      logger.error(
        `[${jobId.slice(0, 7)}] Error while ${method === "create" ? "creating" : "updating"} the issue property option: ${issuePropertyOption.name}`,
        error
      );
      return null;
    }
  };

  const createdUpdatedIssuePropertiesOptions = await processBatchPromises(
    issuePropertiesOptions,
    processIssuePropertyOption,
    5
  );

  return createdUpdatedIssuePropertiesOptions;
};
