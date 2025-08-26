import { PriorityEnum } from "@makeplane/plane-node-sdk";
import { Store } from "@/worker/base";
import { FormUtils, OptionsEntity, GetOptionsForEntityParams } from "../form-utils";

// Mock the dependencies
jest.mock("@/helpers/plane-api-client-v2");
jest.mock("@/worker/base");

const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
};

(Store.getInstance as jest.Mock).mockReturnValue(mockStore);

describe("FormUtils.getOptionsForEntity", () => {
  let formUtils: FormUtils;
  // Using any for mock client since we only need to mock specific methods
  let mockPlaneAPIClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the Plane API client
    mockPlaneAPIClient = {
      labelsApi: {
        listLabels: jest.fn(),
      },
      statesApi: {
        listStates: jest.fn(),
      },
      workItemTypesApi: {
        listIssueTypes: jest.fn(),
      },
      membersApi: {
        getProjectMembers: jest.fn(),
      },
      workItemPropertiesApi: {
        retrieveIssueProperty: jest.fn(),
        listIssuePropertyOptions: jest.fn(),
      },
    };

    // Mock the getPlaneClientV2 function
    const { getPlaneClientV2 } = jest.requireMock("@/helpers/plane-api-client-v2");
    getPlaneClientV2.mockReturnValue(mockPlaneAPIClient);

    formUtils = new FormUtils("test-access-token");
  });

  describe("Caching behavior", () => {
    it("should return cached options when available", async () => {
      const cachedOptions = [
        { value: "1", label: "Label 1" },
        { value: "2", label: "Label 2" },
      ];

      mockStore.get.mockResolvedValue(JSON.stringify(cachedOptions));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        sessionCacheKey: "test-session",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual(cachedOptions);
      expect(mockStore.get).toHaveBeenCalledWith("silo:test-session-labels");
      expect(mockPlaneAPIClient.labelsApi.listLabels).not.toHaveBeenCalled();
    });

    it("should cache options when not available in cache", async () => {
      mockStore.get.mockResolvedValue(null);

      const labels = {
        results: [
          { id: "1", name: "Bug" },
          { id: "2", name: "Feature" },
        ],
      };

      mockPlaneAPIClient.labelsApi.listLabels.mockResolvedValue(labels);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        sessionCacheKey: "test-session",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "Bug" },
        { value: "2", label: "Feature" },
      ]);
      expect(mockStore.set).toHaveBeenCalledWith("silo:test-session-labels", JSON.stringify(result));
    });
  });

  describe("Label options", () => {
    it("should fetch and format label options correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const labels = {
        results: [
          { id: "1", name: "Bug" },
          { id: "2", name: "Feature" },
          { id: "3", name: "Enhancement" },
        ],
      };

      mockPlaneAPIClient.labelsApi.listLabels.mockResolvedValue(labels);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "Bug" },
        { value: "2", label: "Feature" },
        { value: "3", label: "Enhancement" },
      ]);
      expect(mockPlaneAPIClient.labelsApi.listLabels).toHaveBeenCalledWith({
        projectId: "test-project",
        slug: "test-workspace",
      });
    });

    it("should handle labels with null/undefined values", async () => {
      mockStore.get.mockResolvedValue(null);

      const labels = {
        results: [
          { id: null, name: "Bug" },
          { id: undefined, name: "Feature" },
          { id: "3", name: null },
        ],
      };

      mockPlaneAPIClient.labelsApi.listLabels.mockResolvedValue(labels);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "", label: "Bug" },
        { value: "", label: "Feature" },
        { value: "3", label: "" },
      ]);
    });
  });

  describe("State options", () => {
    it("should fetch and format state options correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const states = {
        results: [
          { id: "1", name: "To Do" },
          { id: "2", name: "In Progress" },
          { id: "3", name: "Done" },
        ],
      };

      mockPlaneAPIClient.statesApi.listStates.mockResolvedValue(states);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.STATE,
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "To Do" },
        { value: "2", label: "In Progress" },
        { value: "3", label: "Done" },
      ]);
      expect(mockPlaneAPIClient.statesApi.listStates).toHaveBeenCalledWith({
        projectId: "test-project",
        slug: "test-workspace",
      });
    });
  });

  describe("Priority options", () => {
    it("should return priority options with formatted labels", async () => {
      mockStore.get.mockResolvedValue(null);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.PRIORITY,
      };

      const result = await formUtils.getOptionsForEntity(params);

      const expectedPriorities = Object.values(PriorityEnum).map((priority) => ({
        value: priority,
        label: priority.charAt(0).toUpperCase() + priority.slice(1),
      }));

      expect(result).toEqual(expectedPriorities);
      // Priority options don't make API calls
      expect(mockPlaneAPIClient.labelsApi.listLabels).not.toHaveBeenCalled();
    });
  });

  describe("Work Item Types options", () => {
    it("should fetch and format work item types correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const workItemTypes = [
        { id: "1", name: "Bug" },
        { id: "2", name: "Story" },
        { id: "3", name: "Task" },
      ];

      mockPlaneAPIClient.workItemTypesApi.listIssueTypes.mockResolvedValue(workItemTypes);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.WORK_ITEM_TYPES,
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "Bug" },
        { value: "2", label: "Story" },
        { value: "3", label: "Task" },
      ]);
      expect(mockPlaneAPIClient.workItemTypesApi.listIssueTypes).toHaveBeenCalledWith({
        projectId: "test-project",
        slug: "test-workspace",
      });
    });
  });

  describe("Assignee options", () => {
    it("should fetch and format assignee options correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const assignees = [
        { id: "1", displayName: "John Doe" },
        { id: "2", displayName: "Jane Smith" },
        { id: "3", displayName: "Bob Johnson" },
      ];

      mockPlaneAPIClient.membersApi.getProjectMembers.mockResolvedValue(assignees);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.ASSIGNEE,
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "John Doe" },
        { value: "2", label: "Jane Smith" },
        { value: "3", label: "Bob Johnson" },
      ]);
      expect(mockPlaneAPIClient.membersApi.getProjectMembers).toHaveBeenCalledWith({
        projectId: "test-project",
        slug: "test-workspace",
      });
    });
  });

  describe("Custom field options", () => {
    it("should handle RELATION property type correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const workItemProperty = {
        propertyType: "RELATION",
      };

      const assignees = [
        { id: "1", displayName: "John Doe" },
        { id: "2", displayName: "Jane Smith" },
      ];

      mockPlaneAPIClient.workItemPropertiesApi.retrieveIssueProperty.mockResolvedValue(workItemProperty);
      mockPlaneAPIClient.membersApi.getProjectMembers.mockResolvedValue(assignees);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: "issue-type-1:property-123",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "John Doe" },
        { value: "2", label: "Jane Smith" },
      ]);
      expect(mockPlaneAPIClient.workItemPropertiesApi.retrieveIssueProperty).toHaveBeenCalledWith({
        projectId: "test-project",
        propertyId: "property-123",
        slug: "test-workspace",
        typeId: "issue-type-1",
      });
    });

    it("should handle OPTION property type correctly", async () => {
      mockStore.get.mockResolvedValue(null);

      const workItemProperty = {
        propertyType: "OPTION",
      };

      const propertyOptions = [
        { id: "1", name: "Option 1" },
        { id: "2", name: "Option 2" },
      ];

      mockPlaneAPIClient.workItemPropertiesApi.retrieveIssueProperty.mockResolvedValue(workItemProperty);
      mockPlaneAPIClient.workItemPropertiesApi.listIssuePropertyOptions.mockResolvedValue(propertyOptions);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: "issue-type-1:property-123",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([
        { value: "1", label: "Option 1" },
        { value: "2", label: "Option 2" },
      ]);
      expect(mockPlaneAPIClient.workItemPropertiesApi.listIssuePropertyOptions).toHaveBeenCalledWith({
        projectId: "test-project",
        propertyId: "property-123",
        slug: "test-workspace",
      });
    });

    it("should return empty array for unsupported property types", async () => {
      mockStore.get.mockResolvedValue(null);

      const workItemProperty = {
        propertyType: "TEXT",
      };

      mockPlaneAPIClient.workItemPropertiesApi.retrieveIssueProperty.mockResolvedValue(workItemProperty);

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: "issue-type-1:property-123",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([]);
    });

    it("should throw error for invalid type identifier", async () => {
      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: "invalid-identifier",
      };

      await expect(formUtils.getOptionsForEntity(params)).rejects.toThrow("Invalid type identifier");
    });
  });

  describe("Search filtering", () => {
    it("should filter options based on search text", async () => {
      const cachedOptions = [
        { value: "1", label: "Bug" },
        { value: "2", label: "Feature" },
        { value: "3", label: "Enhancement" },
        { value: "4", label: "Documentation" },
      ];

      mockStore.get.mockResolvedValue(JSON.stringify(cachedOptions));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        searchText: "bug",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([{ value: "1", label: "Bug" }]);
    });

    it("should filter options case-insensitively", async () => {
      const cachedOptions = [
        { value: "1", label: "Bug" },
        { value: "2", label: "FEATURE" },
        { value: "3", label: "enhancement" },
      ];

      mockStore.get.mockResolvedValue(JSON.stringify(cachedOptions));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        searchText: "feature",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([{ value: "2", label: "FEATURE" }]);
    });

    it("should return all options when search text is empty", async () => {
      const cachedOptions = [
        { value: "1", label: "Bug" },
        { value: "2", label: "Feature" },
      ];

      mockStore.get.mockResolvedValue(JSON.stringify(cachedOptions));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        searchText: "",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual(cachedOptions);
    });

    it("should return empty array when no options match search", async () => {
      const cachedOptions = [
        { value: "1", label: "Bug" },
        { value: "2", label: "Feature" },
      ];

      mockStore.get.mockResolvedValue(JSON.stringify(cachedOptions));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
        searchText: "nonexistent",
      };

      const result = await formUtils.getOptionsForEntity(params);

      expect(result).toEqual([]);
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      mockStore.get.mockResolvedValue(null);
      mockPlaneAPIClient.labelsApi.listLabels.mockRejectedValue(new Error("API Error"));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
      };

      await expect(formUtils.getOptionsForEntity(params)).rejects.toThrow("API Error");
    });

    it("should handle cache errors gracefully", async () => {
      mockStore.get.mockRejectedValue(new Error("Cache Error"));

      const params: GetOptionsForEntityParams = {
        slug: "test-workspace",
        projectId: "test-project",
        typeIdentifier: OptionsEntity.LABEL,
      };

      await expect(formUtils.getOptionsForEntity(params)).rejects.toThrow("Cache Error");
    });
  });
});
