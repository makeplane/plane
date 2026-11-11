/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TCommentsOperations } from "@plane/types";
import { CommentCreate } from "./comment-create";

const { clearEditor, updateProjectAssets, updateWorkspaceAssets } = vi.hoisted(() => ({
  clearEditor: vi.fn(),
  updateProjectAssets: vi.fn(),
  updateWorkspaceAssets: vi.fn(),
}));

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
    onChange: (json: object, html: string) => void;
    handleEditorReady: (ready: boolean) => void;
    uploadFile: (blockId: string, file: File) => Promise<string>;
  };
  return {
    LiteTextEditor: forwardRef(function TestEditor(props: EditorProps, ref) {
      const { initialValue, onChange, handleEditorReady, uploadFile } = props;
      const [value, setValue] = useState(initialValue);
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

function setup({ projectId }: { projectId?: string } = { projectId: "project-id" }) {
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
  render(
    <CommentCreate
      workspaceSlug="workspace"
      entityId="issue-id"
      projectId={projectId}
      activityOperations={activityOperations}
      onSubmitCallback={onSubmitCallback}
    />
  );
  return { createComment, uploadCommentAsset, onSubmitCallback, user: userEvent.setup() };
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
