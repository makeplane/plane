/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TCommentsOperations } from "@plane/types";
import { CommentCreate } from "./comment-create";
import { IssueActivity } from "@/components/issues/issue-detail/issue-activity/root";

const { operationsByIssue, clearEditor, updateProjectAssets, updateWorkspaceAssets } = vi.hoisted(() => ({
  operationsByIssue: new Map<string, TCommentsOperations>(),
  clearEditor: vi.fn(),
  updateProjectAssets: vi.fn(),
  updateWorkspaceAssets: vi.fn(),
}));

vi.mock("@plane/hooks", () => ({
  useLocalStorage: (_key: string, initial: unknown) => ({ storedValue: initial, setValue: vi.fn() }),
}));
vi.mock("@/hooks/store/use-project", () => ({ useProject: () => ({ getProjectById: () => ({ anchor: false }) }) }));
vi.mock("@/components/issues/issue-detail/issue-activity/helper", () => ({
  useWorkItemCommentOperations: (_w: string, _p: string, issue: string) => operationsByIssue.get(issue),
}));
vi.mock("@/components/issues/issue-detail/issue-activity/activity-comment-root", () => ({
  IssueActivityCommentRoot: () => null,
}));
vi.mock("@/components/issues/issue-detail/issue-activity/activity-tabs", () => ({
  ActivityTabs: () => null,
  getActivityTabId: () => "tab",
  getActivityTabPanelId: () => "panel",
}));
vi.mock("@/components/issues/issue-detail/issue-activity/sort-root", () => ({ ActivitySortRoot: () => null }));
vi.mock("@/components/issues/issue-detail/issue-activity/filter-root", () => ({ ActivityFilterRoot: () => null }));
vi.mock("@plane/blocks/comment-box", () => ({
  CommentBox: ({
    editor,
    onSubmit,
    canSubmit,
    isSubmitting,
  }: {
    editor: ReactNode;
    onSubmit: () => void;
    canSubmit: boolean;
    isSubmitting: boolean;
  }) => (
    <div>
      {editor}
      <button type="button" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
        Comment
      </button>
    </div>
  ),
}));
vi.mock("@plane/i18n", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@/components/editor/lite-text/toolbar", () => ({ IssueCommentToolbar: () => null }));
vi.mock("@/hooks/store/use-workspace", () => ({
  useWorkspace: () => ({ getWorkspaceBySlug: () => ({ id: "workspace-id" }) }),
}));
vi.mock("@/services/file.service", () => ({
  FileService: class {
    updateBulkProjectAssetsUploadStatus = updateProjectAssets;
    updateBulkWorkspaceAssetsUploadStatus = updateWorkspaceAssets;
  },
}));
vi.mock("@/components/editor/lite-text", async () => {
  const { forwardRef, useEffect, useImperativeHandle, useState } = await import("react");
  type EditorProps = {
    initialValue: string;
    id: string;
    value: string;
    onChange: (json: object, html: string) => void;
    handleEditorReady: (ready: boolean) => void;
    uploadFile: (blockId: string, file: File) => Promise<string>;
  };
  return {
    LiteTextEditor: forwardRef(function TestEditor(props: EditorProps, ref) {
      const { initialValue, onChange, handleEditorReady, uploadFile } = props;
      const [value, setValue] = useState(initialValue);
      // Mirrors production use-editor id/value sync without emitting a form update.
      useEffect(() => {
        setValue(props.value);
      }, [props.id, props.value]);
      useEffect(() => {
        handleEditorReady(true);
      }, [handleEditorReady]);
      useImperativeHandle(ref, () => ({
        isEditorReadyToDiscard: () => true,
        clearEditor: () => {
          clearEditor();
          setValue("<p></p>");
        },
      }));
      return (
        <div>
          <textarea
            aria-label="Comment draft"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              onChange({}, event.target.value);
            }}
          />
          <button type="button" onClick={() => void uploadFile("block-id", new File(["image"], "image.png"))}>
            Upload image
          </button>
        </div>
      );
    }),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  updateProjectAssets.mockResolvedValue(undefined);
  updateWorkspaceAssets.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup({ projectId }: { projectId?: string } = { projectId: "project-id" }, parent = false) {
  const createComment = vi.fn<TCommentsOperations["createComment"]>();
  const uploadCommentAsset = vi.fn<TCommentsOperations["uploadCommentAsset"]>().mockResolvedValue({
    asset_id: "asset-id",
    asset_url: "https://example.com/asset-id",
    upload_data: {
      url: "https://example.com/upload",
      fields: {
        "Content-Type": "image/png",
        key: "asset-id",
        "x-amz-algorithm": "",
        "x-amz-credential": "",
        "x-amz-date": "",
        policy: "",
        "x-amz-signature": "",
      },
    },
  });
  const onSubmitCallback = vi.fn();
  const activityOperations: TCommentsOperations = {
    createComment,
    uploadCommentAsset,
    copyCommentLink: vi.fn(),
    updateComment: vi.fn().mockResolvedValue(undefined),
    removeComment: vi.fn().mockResolvedValue(undefined),
    duplicateCommentAsset: vi.fn().mockResolvedValue({ asset_id: "duplicate-asset-id" }),
    addCommentReaction: vi.fn().mockResolvedValue(undefined),
    deleteCommentReaction: vi.fn().mockResolvedValue(undefined),
    react: vi.fn().mockResolvedValue(undefined),
    reactionIds: vi.fn(),
    userReactions: vi.fn(),
    getReactionUsers: vi.fn().mockReturnValue(""),
  };
  operationsByIssue.set("issue-id", activityOperations);
  const view = render(
    parent ? (
      <IssueActivity workspaceSlug="workspace" projectId="project-id" issueId="issue-id" />
    ) : (
      <CommentCreate
        workspaceSlug="workspace"
        entityId="issue-id"
        projectId={projectId}
        activityOperations={activityOperations}
        onSubmitCallback={onSubmitCallback}
      />
    )
  );
  return { view, activityOperations, createComment, uploadCommentAsset, onSubmitCallback, user: userEvent.setup() };
}

async function enterDraft(user: ReturnType<typeof userEvent.setup>) {
  const draft = screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Comment draft" });
  await user.clear(draft);
  await user.type(draft, "My unsaved comment");
  return draft;
}

describe("CommentCreate", () => {
  it.each(["undefined result", "missing id", "rejection"])(
    "preserves the draft and uploaded assets after %s",
    async (failure) => {
      const { user, createComment, uploadCommentAsset, onSubmitCallback } = setup();
      if (failure === "rejection") createComment.mockRejectedValueOnce(new Error("Create failed"));
      else createComment.mockResolvedValueOnce(failure === "missing id" ? {} : undefined);
      createComment.mockResolvedValueOnce({ id: "comment-id" });
      const draft = await enterDraft(user);
      await user.click(screen.getByRole("button", { name: "Upload image" }));
      await waitFor(() => expect(uploadCommentAsset).toHaveBeenCalledOnce());
      const submit = screen.getByRole<HTMLButtonElement>("button", { name: "Comment" });
      await user.click(submit);
      await waitFor(() => expect(submit.disabled).toBe(false));

      expect(createComment).toHaveBeenCalledOnce();
      expect(draft.value).toBe("My unsaved comment");
      expect(clearEditor).not.toHaveBeenCalled();
      expect(onSubmitCallback).not.toHaveBeenCalled();
      expect(updateProjectAssets).not.toHaveBeenCalled();
      expect(updateWorkspaceAssets).not.toHaveBeenCalled();

      // Retry without retyping or uploading again, proving both form state and asset IDs survived.
      await user.click(submit);
      await waitFor(() => expect(clearEditor).toHaveBeenCalledOnce());
      expect(createComment).toHaveBeenNthCalledWith(2, expect.objectContaining({ comment_html: "My unsaved comment" }));
      expect(updateProjectAssets).toHaveBeenCalledExactlyOnceWith("workspace", "project-id", "issue-id", {
        asset_ids: ["asset-id"],
      });
      expect(onSubmitCallback).toHaveBeenCalledExactlyOnceWith("comment-id");
      expect(draft.value).toBe("<p></p>");
      expect(submit.disabled).toBe(true);
    }
  );

  it("clears a successfully created comment without attachments", async () => {
    const { user, createComment, onSubmitCallback } = setup();
    createComment.mockResolvedValue({ id: "comment-id" });
    const draft = await enterDraft(user);
    await user.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(clearEditor).toHaveBeenCalledOnce());
    expect(draft.value).toBe("<p></p>");
    expect(onSubmitCallback).toHaveBeenCalledExactlyOnceWith("comment-id");
    expect(updateProjectAssets).not.toHaveBeenCalled();
    expect(updateWorkspaceAssets).not.toHaveBeenCalled();
  });

  it("finalizes workspace assets only after creating a comment", async () => {
    const { user, createComment } = setup({});
    createComment.mockResolvedValue({ id: "comment-id" });
    await enterDraft(user);
    await user.click(screen.getByRole("button", { name: "Upload image" }));
    await user.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(clearEditor).toHaveBeenCalledOnce());
    expect(updateWorkspaceAssets).toHaveBeenCalledExactlyOnceWith("workspace", "issue-id", { asset_ids: ["asset-id"] });
    expect(updateProjectAssets).not.toHaveBeenCalled();
  });

  it("clears the draft if the callback throws after the comment was created", async () => {
    const { user, createComment, onSubmitCallback } = setup();
    createComment.mockResolvedValue({ id: "comment-id" });
    onSubmitCallback.mockImplementation(() => {
      throw new Error("Callback failed");
    });
    const draft = await enterDraft(user);
    await user.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(clearEditor).toHaveBeenCalledOnce());
    expect(createComment).toHaveBeenCalledOnce();
    expect(draft.value).toBe("<p></p>");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Comment" }).disabled).toBe(true);
  });

  it("does not retain an already-created comment when asset finalization fails", async () => {
    const { user, createComment } = setup();
    createComment.mockResolvedValue({ id: "comment-id" });
    updateProjectAssets.mockRejectedValueOnce(new Error("Asset finalization failed"));
    const draft = await enterDraft(user);
    await user.click(screen.getByRole("button", { name: "Upload image" }));
    await user.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(clearEditor).toHaveBeenCalledOnce());
    expect(createComment).toHaveBeenCalledOnce();
    expect(draft.value).toBe("<p></p>");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Comment" }).disabled).toBe(true);
  });
});

describe("actual IssueActivity parent identity", () => {
  it("does not submit a failed item's retained form or assets to a different cached item", async () => {
    const { user, view, createComment, activityOperations } = setup(undefined, true);
    createComment.mockResolvedValue(undefined);
    await enterDraft(user);
    await user.click(screen.getByRole("button", { name: "Upload image" }));
    await user.click(screen.getByRole("button", { name: "Comment" }));
    await waitFor(() => expect(createComment).toHaveBeenCalledOnce());
    const nextCreate = vi.fn().mockResolvedValue({ id: "next-comment" });
    operationsByIssue.set("next-issue", { ...activityOperations, createComment: nextCreate });
    view.rerender(<IssueActivity workspaceSlug="workspace" projectId="project-id" issueId="next-issue" />);
    expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: "Comment draft" }).value).toBe("<p></p>");
    const submit = screen.getByRole<HTMLButtonElement>("button", { name: "Comment" });
    await user.click(submit);
    expect(nextCreate).not.toHaveBeenCalled();
    expect(submit.disabled).toBe(true);
    await enterDraft(user);
    await user.click(submit);
    await waitFor(() => expect(nextCreate).toHaveBeenCalledOnce());
    expect(updateProjectAssets).not.toHaveBeenCalled();
  });
});

it("does not let an old pending creation clear the new item's draft", async () => {
  const { user, view, createComment, activityOperations } = setup(undefined, true);
  let finish!: (value: { id: string }) => void;
  createComment.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    })
  );
  await enterDraft(user);
  await user.click(screen.getByRole("button", { name: "Comment" }));
  await waitFor(() => expect(createComment).toHaveBeenCalledOnce());
  operationsByIssue.set("next-issue", { ...activityOperations, createComment: vi.fn() });
  view.rerender(<IssueActivity workspaceSlug="workspace" projectId="project-id" issueId="next-issue" />);
  const nextDraft = await enterDraft(user);
  await user.type(nextDraft, " for next item");
  await act(async () => {
    finish({ id: "old-comment" });
  });
  await waitFor(() => expect(screen.getByRole<HTMLButtonElement>("button", { name: "Comment" }).disabled).toBe(false));
  expect(nextDraft.value).toBe("My unsaved comment for next item");
  expect(clearEditor).not.toHaveBeenCalled();
});
