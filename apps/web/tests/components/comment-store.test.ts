import { describe, expect, it, vi } from "vitest";
import { EIssueServiceType } from "@plane/types";

import { IssueCommentStore } from "@/store/issue/issue-details/comment.store";

const createStore = () => {
  const rootIssueDetail = {
    activity: { fetchActivities: vi.fn() },
    commentReaction: { applyCommentReactions: vi.fn() },
  };
  const store = new IssueCommentStore(rootIssueDetail as never, EIssueServiceType.ISSUES);
  store.comments.issueId = ["commentId"];
  store.commentMap.commentId = { id: "commentId" } as never;
  return store;
};

describe("IssueCommentStore.removeComment", () => {
  it("calls delete once and removes the comment from both indexes after success", async () => {
    const store = createStore();
    const deleteIssueComment = vi.fn().mockResolvedValue(undefined);
    store.issueCommentService = { deleteIssueComment } as never;

    await store.removeComment("workspace", "project", "issueId", "commentId");

    expect(deleteIssueComment).toHaveBeenCalledOnce();
    expect(store.comments.issueId).toEqual([]);
    expect(store.commentMap.commentId).toBeUndefined();
  });

  it("keeps both indexes unchanged when deletion fails", async () => {
    const store = createStore();
    store.issueCommentService = {
      deleteIssueComment: vi.fn().mockRejectedValue(new Error("delete failed")),
    } as never;

    await expect(store.removeComment("workspace", "project", "issueId", "commentId")).rejects.toThrow("delete failed");
    expect(store.comments.issueId).toEqual(["commentId"]);
    expect(store.commentMap.commentId?.id).toBe("commentId");
  });
});
