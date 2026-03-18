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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@plane/logger";
import type { Client as PlaneClient } from "@plane/sdk";
import { CONSTANTS } from "@/helpers/constants";
import type { IGitComment, IPullRequestDetails } from "@/types/behaviours/git";
import { PullRequestBehaviour } from "../pull-request.behaviour";

// Mock dependencies
vi.mock("@plane/logger");
vi.mock("@/env", () => ({
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
  getPullRequest: vi.fn(),
  getPullRequestComments: vi.fn(),
  createPullRequestComment: vi.fn(),
  updatePullRequestComment: vi.fn(),
});

// Helper function to create a mock Plane client
const createMockPlaneClient = () => ({
  issue: {
    getIssueByIdentifier: vi.fn(),
    update: vi.fn(),
    createLink: vi.fn(),
  },
  state: {
    list: vi.fn(),
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

  const mockPlaneStates = {
    results: [
      { id: "draft-state", name: "Draft", group: "unstarted", sequence: 1 },
      { id: "open-state", name: "Open", group: "started", sequence: 1 },
      { id: "ready-state", name: "Ready", group: "started", sequence: 2 },
      { id: "merged-state", name: "Merged", group: "completed", sequence: 1 },
      { id: "closed-state", name: "Closed", group: "cancelled", sequence: 1 },
    ],
  };

  const SORTED_STATE_IDS = ["draft-state", "open-state", "ready-state", "merged-state", "closed-state"];

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
    vi.clearAllMocks();
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
      state: "open-state",
    };

    it("should handle a pull request with issue references successfully", async () => {
      // Setup mocks
      service.getPullRequest.mockImplementation(() => Promise.resolve(mockPullRequest));
      service.getPullRequestComments.mockImplementation(() => Promise.resolve([]));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));
      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));
      planeClient.state.list.mockImplementation(() => Promise.resolve(mockPlaneStates));

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

    it("should create a separate warning comment when workflow transition is disallowed", async () => {
      service.getPullRequestComments.mockImplementation(() => Promise.resolve([]));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));

      await behaviour["manageCommentOnPullRequest"](
        mockPR,
        [
          {
            reference: { identifier: "PL", sequence: 123, isClosing: true },
            issue: { id: "issue-id", project: "project-id", name: "Test Issue" } as any,
          },
        ],
        [],
        [
          {
            reference: { identifier: "PL", sequence: 123, isClosing: true },
            issue: { id: "issue-id", project: "project-id", name: "Test Issue" } as any,
          },
        ]
      );

      expect(service.createPullRequestComment).toHaveBeenCalledTimes(2);
      expect(service.createPullRequestComment).toHaveBeenLastCalledWith(
        "test-owner",
        "test-repo",
        "1",
        "⚠️ State transition attempt blocked by project workflow settings for the following Work Item(s)\n\n- [[PL-123] Test Issue](https://app.plane.so/test-workspace/projects/project-id/issues/issue-id)\n\n\nThis comment was auto-generated by [Plane](https://plane.so)\n"
      );
    });

    it("should update the existing Plane comment and still create a workflow warning comment", async () => {
      const existingComment: IGitComment = {
        id: "comment-1",
        body: "Linked to Plane Work Item(s)\nOld content",
        created_at: "2023-01-01",
        user: { id: "user-1" },
      };

      service.getPullRequestComments.mockImplementation(() => Promise.resolve([existingComment]));
      service.updatePullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));

      await behaviour["manageCommentOnPullRequest"](
        mockPR,
        [
          {
            reference: { identifier: "PL", sequence: 123, isClosing: true },
            issue: { id: "issue-id", project: "project-id", name: "Test Issue" } as any,
          },
        ],
        [],
        [
          {
            reference: { identifier: "PL", sequence: 123, isClosing: true },
            issue: { id: "issue-id", project: "project-id", name: "Test Issue" } as any,
          },
        ]
      );

      expect(service.updatePullRequestComment).toHaveBeenCalledTimes(1);
      expect(service.createPullRequestComment).toHaveBeenCalledTimes(1);
      expect(service.createPullRequestComment).toHaveBeenCalledWith(
        "test-owner",
        "test-repo",
        "1",
        "⚠️ State transition attempt blocked by project workflow settings for the following Work Item(s)\n\n- [[PL-123] Test Issue](https://app.plane.so/test-workspace/projects/project-id/issues/issue-id)\n\n\nThis comment was auto-generated by [Plane](https://plane.so)\n"
      );
    });

    it("should include only blocked work items in the workflow warning comment", async () => {
      service.getPullRequestComments.mockImplementation(() => Promise.resolve([]));
      service.createPullRequestComment.mockImplementation(() => Promise.resolve({} as IGitComment));

      const blockedIssue = {
        reference: { identifier: "PL", sequence: 123, isClosing: true },
        issue: { id: "issue-1", project: "project-id", name: "Blocked Issue" } as any,
      };
      const transitionedIssue = {
        reference: { identifier: "PL", sequence: 124, isClosing: true },
        issue: { id: "issue-2", project: "project-id", name: "Transitioned Issue" } as any,
      };

      await behaviour["manageCommentOnPullRequest"](mockPR, [blockedIssue, transitionedIssue], [], [blockedIssue]);

      expect(service.createPullRequestComment).toHaveBeenCalledTimes(2);
      expect(service.createPullRequestComment).toHaveBeenLastCalledWith(
        "test-owner",
        "test-repo",
        "1",
        "⚠️ State transition attempt blocked by project workflow settings for the following Work Item(s)\n\n- [[PL-123] Blocked Issue](https://app.plane.so/test-workspace/projects/project-id/issues/issue-1)\n\n\nThis comment was auto-generated by [Plane](https://plane.so)\n"
      );
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

      expect(result).toEqual({ result: null, stateTransitionSkipped: false });
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

      expect(result).toEqual({ result: null, stateTransitionSkipped: false });
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

      expect(result).toEqual({ result: null, stateTransitionSkipped: false });
      expect(logger.error).toHaveBeenCalledWith("[TEST-PROVIDER] Error updating issue PL-123", mockError);
    });

    it("should update issue state and create link successfully", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
        state: "draft-state",
      };

      behaviour["projectIdToSortedStateIds"] = {
        "project-id": SORTED_STATE_IDS,
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
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.getIssueByIdentifier).toHaveBeenCalledWith("test-workspace", "PL", 123, true);
      expect(planeClient.issue.update).toHaveBeenCalled();
      expect(planeClient.issue.createLink).toHaveBeenCalled();
    });

    it("should flag workflow transition disallowed errors and still return issue context", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
      };
      const transitionError = { error: "State transition is not allowed" };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.reject(transitionError));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: true,
      });
      expect(planeClient.issue.createLink).toHaveBeenCalledWith(
        "test-workspace",
        "project-id",
        "issue-id",
        "[1] Fix PL-123",
        "https://test.com/pr/1"
      );
    });

    it("should not update state for non-closing references but should still create a link", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
      };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: false },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: false },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.update).not.toHaveBeenCalled();
      expect(planeClient.issue.createLink).toHaveBeenCalledWith(
        "test-workspace",
        "project-id",
        "issue-id",
        "[1] Fix PL-123",
        "https://test.com/pr/1"
      );
    });

    it("should return issue context for permission errors raised during link creation", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
      };
      const permissionError = new Error("Permission denied");
      (permissionError as any).detail = CONSTANTS.NO_PERMISSION_ERROR;

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.reject(permissionError));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
    });

    it("should flag workflow transition errors from nested response payloads", async () => {
      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
      };
      const transitionError = {
        response: {
          data: {
            detail: "State transition is not allowed for this issue",
          },
        },
      };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.reject(transitionError));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: true,
      });
    });

    it("should still transition allowed work items when another referenced work item is blocked", async () => {
      const firstIssue = {
        id: "issue-1",
        project: "project-id",
        name: "Blocked Issue",
      };
      const secondIssue = {
        id: "issue-2",
        project: "project-id",
        name: "Allowed Issue",
      };
      const transitionError = { error: "State transition is not allowed" };

      planeClient.issue.getIssueByIdentifier
        .mockImplementationOnce(() => Promise.resolve(firstIssue))
        .mockImplementationOnce(() => Promise.resolve(secondIssue));
      planeClient.issue.update
        .mockImplementationOnce(() => Promise.reject(transitionError))
        .mockImplementationOnce(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const firstResult = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );
      const secondResult = await behaviour["updateSingleIssue"](
        { identifier: "PL", sequence: 124, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(firstResult).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: firstIssue,
        },
        stateTransitionSkipped: true,
      });
      expect(secondResult).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 124, isClosing: true },
          issue: secondIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.update).toHaveBeenNthCalledWith(1, "test-workspace", "project-id", "issue-1", {
        state: "open-state",
      });
      expect(planeClient.issue.update).toHaveBeenNthCalledWith(2, "test-workspace", "project-id", "issue-2", {
        state: "open-state",
      });
    });
  });

  describe("backward state movement", () => {
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

    it("should skip state update when skipBackwardStateMovement is enabled and target state is behind current state", async () => {
      const entityConnectionsWithSkip = [
        {
          ...mockEntityConnections[0],
          config: { ...mockConfig, skipBackwardStateMovement: true },
        },
      ];
      const behaviourWithSkip = new PullRequestBehaviour(
        "test-provider",
        "test-workspace",
        service,
        planeClient as unknown as PlaneClient,
        entityConnectionsWithSkip
      );
      behaviourWithSkip["projectIdToSortedStateIds"] = {
        "project-id": SORTED_STATE_IDS,
      };

      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
        state: "merged-state",
      };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviourWithSkip["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_OPENED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.update).not.toHaveBeenCalled();
      expect(planeClient.issue.createLink).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining("skip backward state movement is enabled"),
        expect.any(Object)
      );
    });

    it("should allow state update when skipBackwardStateMovement is enabled but target state is ahead of current state", async () => {
      const entityConnectionsWithSkip = [
        {
          ...mockEntityConnections[0],
          config: { ...mockConfig, skipBackwardStateMovement: true },
        },
      ];
      const behaviourWithSkip = new PullRequestBehaviour(
        "test-provider",
        "test-workspace",
        service,
        planeClient as unknown as PlaneClient,
        entityConnectionsWithSkip
      );
      behaviourWithSkip["projectIdToSortedStateIds"] = {
        "project-id": SORTED_STATE_IDS,
      };

      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
        state: "draft-state",
      };

      planeClient.issue.getIssueByIdentifier.mockImplementation(() => Promise.resolve(mockIssue));
      planeClient.issue.update.mockImplementation(() => Promise.resolve({} as any));
      planeClient.issue.createLink.mockImplementation(() => Promise.resolve({} as any));

      const result = await behaviourWithSkip["updateSingleIssue"](
        { identifier: "PL", sequence: 123, isClosing: true },
        mockPR,
        "MR_MERGED"
      );

      expect(result).toEqual({
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.update).toHaveBeenCalledWith("test-workspace", "project-id", "issue-id", {
        state: "merged-state",
      });
      expect(planeClient.issue.createLink).toHaveBeenCalled();
    });

    it("should allow backward state movement when skipBackwardStateMovement is not enabled", async () => {
      behaviour["projectIdToSortedStateIds"] = {
        "project-id": SORTED_STATE_IDS,
      };

      const mockIssue = {
        id: "issue-id",
        project: "project-id",
        name: "Test Issue",
        state: "merged-state",
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
        result: {
          reference: { identifier: "PL", sequence: 123, isClosing: true },
          issue: mockIssue,
        },
        stateTransitionSkipped: false,
      });
      expect(planeClient.issue.update).toHaveBeenCalledWith("test-workspace", "project-id", "issue-id", {
        state: "open-state",
      });
      expect(planeClient.issue.createLink).toHaveBeenCalled();
    });
  });
});
