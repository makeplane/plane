import { protect } from "@/lib";
import { logger } from "@/logger";
import { ExIssueProperty, ExIssueType, ExIssuePropertyOption, Client as PlaneClient } from "@plane/sdk";

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
  const createdUpdatedIssueProperties: ExIssueProperty[] = [];

  const issuePropertyPromises = issueProperties.map(async (issueProperty) => {
    try {
      let createdUpdatedIssueProperty: ExIssueProperty | undefined;
      const issueType = issueTypesMap.get(issueProperty.type_id || "") || defaultIssueType;
      if (!issueType) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue type not found for the issue property: ${issueProperty.display_name}`
        );
        return;
      }

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
      if (createdUpdatedIssueProperty) {
        createdUpdatedIssueProperties.push(createdUpdatedIssueProperty);
      }
    } catch (error) {
      logger.error(
        `[${jobId.slice(0, 7)}] Error while ${method === "create" ? "creating" : "updating"} the issue property: ${issueProperty.display_name}`,
        error
      );
    }
  });

  await Promise.all(issuePropertyPromises);
  return createdUpdatedIssueProperties;
};

export const createOrUpdateIssuePropertiesOptions = async (
  props: TCreateOrUpdateIssuePropertiesOptions
): Promise<ExIssuePropertyOption[]> => {
  const { jobId, issuePropertyMap, issuePropertiesOptions, planeClient, workspaceSlug, projectId, method } = props;
  const createdUpdatedIssuePropertiesOptions: ExIssuePropertyOption[] = [];

  const issuePropertyOptionsPromises = issuePropertiesOptions.map(async (issuePropertyOption) => {
    try {
      let createdUpdatedIssuePropertyOption: ExIssuePropertyOption | undefined;

      const issueProperty = issuePropertyMap.get(`customfield_${issuePropertyOption.property_id}` || "");
      if (!issueProperty) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue property not found for the issue property option: ${issuePropertyOption.name}`
        );
        return;
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
      if (createdUpdatedIssuePropertyOption) {
        createdUpdatedIssuePropertiesOptions.push(createdUpdatedIssuePropertyOption);
      }
    } catch (error) {
      logger.error(
        `[${jobId.slice(0, 7)}] Error while ${method === "create" ? "creating" : "updating"} the issue property option: ${issuePropertyOption.name}`,
        error
      );
    }
  });

  await Promise.all(issuePropertyOptionsPromises);
  return createdUpdatedIssuePropertiesOptions;
};
