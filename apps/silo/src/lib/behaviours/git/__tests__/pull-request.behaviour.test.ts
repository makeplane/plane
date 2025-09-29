import { logger } from "@plane/logger";
import { Client as PlaneClient } from "@plane/sdk";
import { CONSTANTS } from "@/helpers/constants";
import { IGitComment, IPullRequestDetails } from "@/types/behaviours/git";
import { PullRequestBehaviour } from "../pull-request.behaviour";

// Mock dependencies
jest.mock("@plane/logger");
jest.mock("@/env", () => ({
  env: {
    APP_BASE_URL: "https://app.plane.so",
  },
}));

// Mock types and data
type MockPullRequestData = {
  owner: string;
  repositoryName: string;
  pullRequestIdentifier: string;
};

// Helper function to create a mock PR service
const createMockPullRequestService = () => ({
  getPullRequest: jest.fn(),
  getPullRequestComments: jest.fn(),
  createPullRequestComment: jest.fn(),
  updatePullRequestComment: jest.fn(),
});

// Helper function to create a mock Plane client
const createMockPlaneClient = () => ({
  issue: {
    getIssueByIdentifier: jest.fn(),
    update: jest.fn(),
    createLink: jest.fn(),
  },
});

describe("PullRequestBehaviour", () => {
  let service: ReturnType<typeof createMockPullRequestService>;
  let planeClient: ReturnType<typeof createMockPlaneClient>;
  let behaviour: PullRequestBehaviour;

  const mockConfig = {
    states: {
      mergeRequestEventMapping: {
        MR_MERGED: { id: "merged-state", name: "Merged" },
        MR_CLOSED: { id: "closed-state", name: "Closed" },
        MR_OPENED: { id: "open-state", name: "Open" },
        DRAFT_MR_OPENED: { id: "draft-state", name: "Draft" },
        MR_READY_FOR_MERGE: { id: "ready-state", name: "Ready" },
      },
    },
  };

  const mockEntityConnections = [
    {
      id: "1",
      type: "github",
      workspace_connection_id: "1",
      workspace_id: "1",
      workspace_slug: "test-workspace",
      project_id: "project-id",
      config: mockConfig,
      entity_data: {
        project_id: "project-id",
        project_name: "test-project",
        project_slug: "test-project",
      },
    },
  ];
  beforeEach(() => {
    service = createMockPullRequestService();
    planeClient = createMockPlaneClient();
    behaviour = new PullRequestBehaviour(
      "test-provider",
      "test-workspace",
      service,
      planeClient as unknown as PlaneClient,
      mockEntityConnections
    );

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("handleEvent", () => {
    const mockPullRequestData: MockPullRequestData = {
      owner: "test-owner",
      repositoryName: "test-repo",
      pullRequestIdentifier: "123",
    };

    const mockPullRequest: IPullRequestDetails = {
      title: "Fix bug PL-123",
      description: "Fixes issue PL-123",
      number: 123,
      url: "https://github.com/test-owner/test-repo/pull/123",
      repository: {
        owner: "test-owner",
        name: "test-repo",
        id: "repo-id",
      },
      state: "open",
      merged: false,
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
    };

    const mockIssue = {
      id: "issue-id",
      project: "project-id",
      name: "Test Issue",
      sequence: 123,
    };

    it("should handle a pull request with issue references successfully", async () => {
      // Setup mocks
      service.getPullRequest.mockImplementation(() => Promise.resolve(mockPullRequest));
      service.getPullRequestComments.mockImplementation(() => Promise.resolve([]));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));
      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      // Execute
      await behaviour.handleEvent(mockPullRequestData);

      // Verify
      expect(service.getPullRequest).toHaveBeenCalledWith(
        mockPullRequestData.owner,
        mockPullRequestData.repositoryName,
        mockPullRequestData.pullRequestIdentifier
      );
      expect(planeClient.issue.getIssueByIdentifier).toHaveBeenCalled();
      expect(service.createPullRequestComment).toHaveBeenCalled();
    });

    it("should handle pull request not found error gracefully", async () => {
      // Setup mock to simulate PR not found
      service.getPullRequest.mockImplementation(() => Promise.reject(new Error("Not found")));

      // Execute
      await behaviour.handleEvent(mockPullRequestData);

      // Verify
      expect(logger.error).toHaveBeenCalled();
      expect(planeClient.issue.getIssueByIdentifier).not.toHaveBeenCalled();
    });

    it("should skip processing when no issue references found", async () => {
      // Setup mock PR with no issue references
      const prWithoutRefs = {
        ...mockPullRequest,
        title: "Update readme",
        description: "Documentation update",
      };
      service.getPullRequest.mockImplementation(() => Promise.resolve(prWithoutRefs));

      // Execute
      await behaviour.handleEvent(mockPullRequestData);

      // Verify
      expect(planeClient.issue.getIssueByIdentifier).not.toHaveBeenCalled();
      expect(service.createPullRequestComment).not.toHaveBeenCalled();
    });
  });

  describe("classifyPullRequestEvent", () => {
    it.each([
      [{ state: "closed", merged: true }, "MR_MERGED"],
      [{ state: "closed", merged: false }, "MR_CLOSED"],
      [{ state: "open", draft: true }, "DRAFT_MR_OPENED"],
      [{ state: "open", draft: false, mergeable: true, mergeable_state: "clean" }, "MR_READY_FOR_MERGE"],
      [{ state: "open", draft: false, mergeable: false }, "MR_OPENED"],
    ])("should classify PR state correctly", (prState, expectedEvent) => {
      const mockPR = {
        title: "",
        description: "",
        number: 1,
        url: "",
        repository: { owner: "", name: "", id: "" },
        ...prState,
      } as IPullRequestDetails;

      const event = behaviour["classifyPullRequestEvent"](mockPR);
      expect(event).toBe(expectedEvent);
    });
  });

  describe("comment management", () => {
    const mockPR: IPullRequestDetails = {
      title: "Test PR",
      description: "Test description",
      number: 1,
      url: "https://test.com/pr/1",
      repository: {
        owner: "test-owner",
        name: "test-repo",
        id: "1",
      },
      state: "open",
      merged: false,
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
    };

    it("should create a new comment when none exists", async () => {
      service.getPullRequestComments.mockImplementation(() => Promise.resolve([]));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));

      await behaviour["manageCommentOnPullRequest"](
        mockPR,
        [{ reference: { identifier: "PL", sequence: 123, isClosing: true }, issue: { name: "Test Issue" } as any }],
        []
      );

      expect(service.createPullRequestComment).toHaveBeenCalled();
      expect(service.updatePullRequestComment).not.toHaveBeenCalled();
    });

    it("should update existing comment when found", async () => {
      const existingComment: IGitComment = {
        id: "comment-1",
        body: "Pull Request Linked with Plane\nOld content",
        created_at: "2023-01-01",
        user: { id: "user-1" },
      };

      service.getPullRequestComments.mockImplementation(() => Promise.resolve([existingComment]));
      service.updatePullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));

      await behaviour["manageCommentOnPullRequest"](
        mockPR,
        [{ reference: { identifier: "PL", sequence: 123, isClosing: true }, issue: { name: "Test Issue" } as any }],
        []
      );

      expect(service.updatePullRequestComment).toHaveBeenCalled();
      expect(service.createPullRequestComment).not.toHaveBeenCalled();
    });
  });

  describe("issue updates", () => {
    const mockPR: IPullRequestDetails = {
      title: "Fix PL-123",
      description: "Fixes issue PL-123",
      number: 1,
      url: "https://test.com/pr/1",
      repository: {
        owner: "test-owner",
        name: "test-repo",
        id: "1",
      },
      state: "open",
      merged: false,
      draft: false,
      mergeable: true,
      mergeable_state: "clean",
    };

    it("should handle permission errors gracefully", async () => {
      const mockError = new Error("Permission denied");
      (mockError as any).detail = CONSTANTS.NO_PERMISSION_ERROR;
      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.reject(mockError));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringMatching(/^\[TEST-PROVIDER\] No permission to process event/)
      );
    });

    it("should handle not found errors gracefully", async () => {
      const mockError = new Error("Not found");
      (mockError as any).status = 404;
      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.reject(mockError));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith("[TEST-PROVIDER] Issue not found: PL-123");
    });

    it("should handle generic errors gracefully", async () => {
      const mockError = new Error("Generic error");
      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.reject(mockError));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalledWith("[TEST-PROVIDER] Error updating issue PL-123", mockError);
    });

    it("should update issue state and create link successfully", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
      };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        reference: { identifier: "PL", sequence: 123, isClosing: true },
        issue: mockIssue,
      });
      expect(planeClient.issue.getIssueByIdentifier).toHaveBeenCalledWith("test-workspace", "PL", 123);
      expect(planeClient.issue.update).toHaveBeenCalled();
      expect(planeClient.issue.createLink).toHaveBeenCalled();
    });
  });
});
