import {
  ExIssue,
  ExIssueComment,
  PlaneWebhookPayloadBase,
  E_PLANE_WEBHOOK_EVENT,
  E_PLANE_WEBHOOK_ACTION,
} from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { E_KNOWN_FIELD_KEY } from "@/types/form/base";
import { Store } from "@/worker/base";
import {
  TSlackDMAlert,
  TSlackDMAlertActivity,
  ESlackDMAlertActivityType,
  ESlackDMAlertActivityAction,
  ESlackDMAlertType,
} from "../../types/alerts";
import {
  extractSlackDMAlertsFromWebhook,
  setSlackDMAlert,
  getSlackDMAlertFromStore,
  extractDMCandidatesMap,
} from "../alerts";

// Mock Store class for testing
jest.mock("@/worker/base", () => ({
  Store: {
    getInstance: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
    })),
  },
}));

// Test utilities for creating mock payloads
const createMockActor = (overrides: Partial<any> = {}) => ({
  id: "actor1",
  display_name: "Actor 1",
  first_name: "Actor",
  last_name: "1",
  avatar: "",
  role: 20,
  ...overrides,
});

const createMockActivity = (overrides: Partial<any> = {}) => ({
  field: E_KNOWN_FIELD_KEY.ASSIGNEE_IDS,
  old_value: ["user1"],
  new_value: ["user1", "user2"],
  timestamp: new Date().toISOString(),
  actor: createMockActor(),
  old_identifier: "",
  new_identifier: "",
  ...overrides,
});

const createMockIssuePayload = (overrides: Partial<any> = {}) => ({
  event: E_PLANE_WEBHOOK_EVENT.ISSUE,
  action: E_PLANE_WEBHOOK_ACTION.UPDATED,
  workspace_id: "workspace1",
  webhook_id: "webhook1",
  data: {
    id: "issue1",
    project: "project1",
    description_html: "Issue description",
    ...overrides.data,
  } as ExIssue,
  activity: createMockActivity(overrides.activity),
  ...overrides,
});

const createMockCommentPayload = (overrides: Partial<any> = {}) => ({
  event: E_PLANE_WEBHOOK_EVENT.ISSUE_COMMENT,
  action: E_PLANE_WEBHOOK_ACTION.CREATED,
  workspace_id: "workspace1",
  webhook_id: "webhook1",
  data: {
    id: "comment1",
    project: "project1",
    issue: "issue1",
    comment_html: '<mention-component entity_identifier="user456">@jane</mention-component> what do you think?',
    ...overrides.data,
  } as ExIssueComment,
  activity: createMockActivity({
    field: "",
    old_value: "",
    new_value: "",
    ...overrides.activity,
  }),
  ...overrides,
});

describe("Slack DM Alerts", () => {
  describe("extractSlackDMAlertsFromWebhook", () => {
    describe("ISSUE events", () => {
      it("should extract assignee change activities for added assignees", () => {
        const mockPayload = {
          event: E_PLANE_WEBHOOK_EVENT.ISSUE,
          action: E_PLANE_WEBHOOK_ACTION.UPDATED,
          workspace_id: "workspace1",
          webhook_id: "webhook1",
          data: {
            id: "issue1",
            project: "project1",
            description_html: "Issue description",
          } as ExIssue,
          activity: {
            field: E_KNOWN_FIELD_KEY.ASSIGNEE_IDS,
            old_value: ["user1"],
            new_value: ["user1", "user2", "user3"],
            timestamp: new Date().toISOString(),
            actor: {
              id: "actor1",
              display_name: "Actor 1",
              first_name: "Actor",
              last_name: "1",
              avatar: "",
              role: 20,
            } as any,
            old_identifier: "",
            new_identifier: "",
          },
        };

        const result = extractSlackDMAlertsFromWebhook(mockPayload as unknown as PlaneWebhookPayloadBase<ExIssue>);

        expect(result.type).toBe(ESlackDMAlertType.ISSUE);
        expect(result.workspace_id).toBe("workspace1");
        expect(result.project_id).toBe("project1");
        expect(result.issue_id).toBe("issue1");
        expect(result.comment_id).toBeUndefined();
        expect(result.activities).toHaveLength(2);
        expect(result.activities).toContainEqual({
          actor_id: "user2",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        });
        expect(result.activities).toContainEqual({
          actor_id: "user3",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        });
      });

      it("should extract assignee change activities for removed assignees", () => {
        const mockPayload = {
          event: E_PLANE_WEBHOOK_EVENT.ISSUE,
          action: E_PLANE_WEBHOOK_ACTION.UPDATED,
          workspace_id: "workspace1",
          webhook_id: "webhook1",
          data: {
            id: "issue1",
            project: "project1",
            description_html: "Issue description",
          } as ExIssue,
          activity: {
            field: E_KNOWN_FIELD_KEY.ASSIGNEE_IDS,
            old_value: ["user1", "user2", "user3"],
            new_value: ["user2"],
            timestamp: new Date().toISOString(),
            actor: {
              id: "actor1",
              display_name: "Actor 1",
              first_name: "Actor",
              last_name: "1",
              avatar: "",
              role: 20,
            } as any,
            old_identifier: "",
            new_identifier: "",
          },
        };

        const result = extractSlackDMAlertsFromWebhook(mockPayload as unknown as PlaneWebhookPayloadBase<ExIssue>);

        expect(result.activities).toHaveLength(2);
        expect(result.activities).toContainEqual({
          actor_id: "user1",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.REMOVED,
        });
        expect(result.activities).toContainEqual({
          actor_id: "user3",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.REMOVED,
        });
      });

      it("should handle mixed assignee additions and removals", () => {
        const mockPayload = {
          event: E_PLANE_WEBHOOK_EVENT.ISSUE,
          action: E_PLANE_WEBHOOK_ACTION.UPDATED,
          workspace_id: "workspace1",
          webhook_id: "webhook1",
          data: {
            id: "issue1",
            project: "project1",
            description_html: "Issue description",
          } as ExIssue,
          activity: {
            field: E_KNOWN_FIELD_KEY.ASSIGNEE_IDS,
            old_value: ["user1", "user2"],
            new_value: ["user2", "user3"],
            timestamp: new Date().toISOString(),
            actor: {
              id: "actor1",
              display_name: "Actor 1",
              first_name: "Actor",
              last_name: "1",
              avatar: "",
              role: 20,
            } as any,
            old_identifier: "",
            new_identifier: "",
          },
        };

        const result = extractSlackDMAlertsFromWebhook(mockPayload as unknown as PlaneWebhookPayloadBase<ExIssue>);

        expect(result.activities).toHaveLength(2);
        expect(result.activities).toContainEqual({
          actor_id: "user3",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        });
        expect(result.activities).toContainEqual({
          actor_id: "user1",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.REMOVED,
        });
      });

      it("should extract description mentions", () => {
        const mockPayload = createMockIssuePayload({
          data: {
            description_html:
              '<mention-component entity_identifier="user123">@john</mention-component> please review this',
          },
          activity: {
            field: E_KNOWN_FIELD_KEY.DESCRIPTION_HTML,
            old_value: "old description",
            new_value: "new description",
          },
        });

        const result = extractSlackDMAlertsFromWebhook(mockPayload as unknown as PlaneWebhookPayloadBase<ExIssue>);

        expect(result.activities).toHaveLength(1);
        expect(result.activities[0]).toEqual({
          actor_id: "user123",
          type: ESlackDMAlertActivityType.WORK_ITEM_DESCRIPTION_MENTION,
          action: ESlackDMAlertActivityAction.ADDED,
        });
      });

      it("should return empty activities for unsupported fields", () => {
        const mockPayload = createMockIssuePayload({
          activity: {
            field: "priority",
            old_value: "low",
            new_value: "high",
          },
        });

        const result = extractSlackDMAlertsFromWebhook(mockPayload as unknown as PlaneWebhookPayloadBase<ExIssue>);

        expect(result.activities).toEqual([]);
      });
    });

    describe("ISSUE_COMMENT events", () => {
      it("should extract comment mentions", () => {
        const mockPayload = createMockCommentPayload({
          data: {
            project: "project1",
            issue: "issue1",
            id: "comment1",
            comment_html: '<mention-component entity_identifier="user456">@jane</mention-component> what do you think?',
          },
        });

        const result = extractSlackDMAlertsFromWebhook(
          mockPayload as unknown as PlaneWebhookPayloadBase<ExIssueComment>
        );

        expect(result.type).toBe(ESlackDMAlertType.COMMENT);
        expect(result.workspace_id).toBe("workspace1");
        expect(result.project_id).toBe("project1");
        expect(result.issue_id).toBe("issue1");
        expect(result.comment_id).toBe("comment1");
        expect(result.activities).toHaveLength(1);
        expect(result.activities[0]).toEqual({
          actor_id: "user456",
          type: ESlackDMAlertActivityType.COMMENT_MENTION,
          action: ESlackDMAlertActivityAction.ADDED,
        });
      });

      it("should handle multiple mentions in comments", () => {
        const mockPayload = createMockCommentPayload({
          data: {
            comment_html:
              '<mention-component entity_identifier="user1">@john</mention-component> and <mention-component entity_identifier="user2">@jane</mention-component> please review',
          },
        });

        const result = extractSlackDMAlertsFromWebhook(
          mockPayload as unknown as PlaneWebhookPayloadBase<ExIssueComment>
        );

        expect(result.activities).toHaveLength(2);
        expect(result.activities).toContainEqual({
          actor_id: "user1",
          type: ESlackDMAlertActivityType.COMMENT_MENTION,
          action: ESlackDMAlertActivityAction.ADDED,
        });
        expect(result.activities).toContainEqual({
          actor_id: "user2",
          type: ESlackDMAlertActivityType.COMMENT_MENTION,
          action: ESlackDMAlertActivityAction.ADDED,
        });
      });
    });

    it("should throw error for unsupported event types", () => {
      const mockPayload = {
        event: "UNSUPPORTED_EVENT",
        workspace_id: "workspace1",
        data: {},
      } as any;

      expect(() => extractSlackDMAlertsFromWebhook(mockPayload)).toThrow("Unsupported event type: UNSUPPORTED_EVENT");
    });
  });

  describe("setSlackDMAlert and getSlackDMAlertFromStore", () => {
    let mockStore: any;

    beforeEach(() => {
      mockStore = {
        get: jest.fn(),
        set: jest.fn(),
      };
      (Store.getInstance as jest.Mock).mockReturnValue(mockStore);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should store new alert when no existing alert exists", async () => {
      const alert: TSlackDMAlert = {
        activities: [
          {
            actor_id: "user1",
            type: ESlackDMAlertActivityType.ASSIGNEE,
            action: ESlackDMAlertActivityAction.ADDED,
          },
        ],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      mockStore.get.mockResolvedValue(null);

      await setSlackDMAlert(
        mockStore,
        {
          workspace_id: "workspace1",
          project_id: "project1",
          issue_id: "issue1",
          issue_comment_id: undefined,
        },
        alert,
        60
      );

      expect(mockStore.set).toHaveBeenCalledWith(
        "silo:slack:alert:dm:workspace1:project1:issue1",
        JSON.stringify(alert),
        60,
        false
      );
    });

    it("should merge alerts when existing alert exists (deduplication)", async () => {
      const existingAlert: TSlackDMAlert = {
        activities: [
          {
            actor_id: "user1",
            type: ESlackDMAlertActivityType.ASSIGNEE,
            action: ESlackDMAlertActivityAction.ADDED,
          },
        ],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      const newAlert: TSlackDMAlert = {
        activities: [
          {
            actor_id: "user2",
            type: ESlackDMAlertActivityType.ASSIGNEE,
            action: ESlackDMAlertActivityAction.ADDED,
          },
        ],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      mockStore.get.mockResolvedValue(JSON.stringify(existingAlert));

      await setSlackDMAlert(
        mockStore,
        {
          workspace_id: "workspace1",
          project_id: "project1",
          issue_id: "issue1",
          issue_comment_id: undefined,
        },
        newAlert,
        60
      );

      const expectedMergedAlert = {
        ...existingAlert,
        activities: [...existingAlert.activities, ...newAlert.activities],
      };

      expect(mockStore.set).toHaveBeenCalledWith(
        "silo:slack:alert:dm:workspace1:project1:issue1",
        JSON.stringify(expectedMergedAlert),
        60,
        false
      );
    });

    it("should deduplicate identical activities when merging", async () => {
      const duplicateActivity = {
        actor_id: "user1",
        type: ESlackDMAlertActivityType.ASSIGNEE,
        action: ESlackDMAlertActivityAction.ADDED,
      };

      const existingAlert: TSlackDMAlert = {
        activities: [duplicateActivity],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      const newAlert: TSlackDMAlert = {
        activities: [duplicateActivity], // Same activity
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      mockStore.get.mockResolvedValue(JSON.stringify(existingAlert));

      await setSlackDMAlert(
        mockStore,
        {
          workspace_id: "workspace1",
          project_id: "project1",
          issue_id: "issue1",
          issue_comment_id: undefined,
        },
        newAlert,
        60
      );

      const storedAlert = JSON.parse((mockStore.set as jest.Mock).mock.calls[0][1]);
      expect(storedAlert.activities).toHaveLength(1); // Should not duplicate
    });

    it("should preserve comment_id when merging alerts", async () => {
      const existingAlert: TSlackDMAlert = {
        activities: [],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: "comment1",
        type: ESlackDMAlertType.COMMENT,
        payload: {} as ExIssueComment,
      };

      const newAlert: TSlackDMAlert = {
        activities: [
          {
            actor_id: "user1",
            type: ESlackDMAlertActivityType.COMMENT_MENTION,
            action: ESlackDMAlertActivityAction.ADDED,
          },
        ],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.COMMENT,
        payload: {} as ExIssueComment,
      };

      mockStore.get.mockResolvedValue(JSON.stringify(existingAlert));

      await setSlackDMAlert(
        mockStore,
        {
          workspace_id: "workspace1",
          project_id: "project1",
          issue_id: "issue1",
          issue_comment_id: "comment1",
        },
        newAlert,
        60
      );

      const storedAlert = JSON.parse((mockStore.set as jest.Mock).mock.calls[0][1]);
      expect(storedAlert.comment_id).toBe("comment1");
    });

    it("should retrieve alert from store", async () => {
      const alert: TSlackDMAlert = {
        activities: [],
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        comment_id: undefined,
        type: ESlackDMAlertType.ISSUE,
        payload: {} as ExIssue,
      };

      mockStore.get.mockResolvedValue(JSON.stringify(alert));

      const result = await getSlackDMAlertFromStore(mockStore, {
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        issue_comment_id: undefined,
      });

      expect(result).toEqual(alert);
      expect(mockStore.get).toHaveBeenCalledWith("silo:slack:alert:dm:workspace1:project1:issue1");
    });

    it("should return undefined when alert not found in store", async () => {
      mockStore.get.mockResolvedValue(null);

      const result = await getSlackDMAlertFromStore(mockStore, {
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        issue_comment_id: undefined,
      });

      expect(result).toBeUndefined();
    });

    it("should handle JSON parse errors gracefully", async () => {
      mockStore.get.mockResolvedValue("invalid json");

      const result = await getSlackDMAlertFromStore(mockStore, {
        workspace_id: "workspace1",
        project_id: "project1",
        issue_id: "issue1",
        issue_comment_id: undefined,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("getDMCandidatesMap", () => {
    const mockWorkspaceConnection = {
      config: {
        alertsConfig: {
          dmAlerts: {
            user1: { isEnabled: true },
            user2: { isEnabled: false },
            user3: { isEnabled: true },
          },
        },
      },
    } as TWorkspaceConnection;

    it("should filter users with alerts enabled", () => {
      const activities: TSlackDMAlertActivity[] = [
        {
          actor_id: "user1",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        },
        {
          actor_id: "user2",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        },
      ];

      const planeToSlackMap = new Map([
        ["user1", "slack1"],
        ["user2", "slack2"],
      ]);

      const result = extractDMCandidatesMap(activities, planeToSlackMap, mockWorkspaceConnection);
      expect(result.size).toBe(1);
      expect(result.get("user1")).toBe("slack1");
      expect(result.has("user2")).toBe(false); // disabled alerts
    });

    it("should exclude users without Slack mapping", () => {
      const activities: TSlackDMAlertActivity[] = [
        {
          actor_id: "user1",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        },
        {
          actor_id: "user3",
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        },
      ];

      const planeToSlackMap = new Map([["user1", "slack1"]]); // user3 missing

      const result = extractDMCandidatesMap(activities, planeToSlackMap, mockWorkspaceConnection);
      expect(result.size).toBe(1);
      expect(result.get("user1")).toBe("slack1");
      expect(result.has("user3")).toBe(false);
    });

    it("should return empty map when no candidates", () => {
      const activities: TSlackDMAlertActivity[] = [
        {
          actor_id: "user4", // not in config
          type: ESlackDMAlertActivityType.ASSIGNEE,
          action: ESlackDMAlertActivityAction.ADDED,
        },
      ];

      const planeToSlackMap = new Map([["user4", "slack4"]]);

      const result = extractDMCandidatesMap(activities, planeToSlackMap, mockWorkspaceConnection);
      expect(result.size).toBe(0);
    });
  });
});
