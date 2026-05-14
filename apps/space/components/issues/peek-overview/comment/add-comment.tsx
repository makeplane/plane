/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, Controller } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { SitesFileService } from "@plane/services";
import type { TIssuePublicComment } from "@plane/types";
// editor components
import { LiteTextEditor } from "@/components/editor/lite-text-editor";
// hooks
import { usePublish } from "@/hooks/store/publish";
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import { useUser } from "@/hooks/store/use-user";
// services
const fileService = new SitesFileService();

const defaultValues: Partial<TIssuePublicComment> = {
  comment_html: "",
};

type Props = {
  anchor: string;
  disabled?: boolean;
};

export const AddComment = observer(function AddComment(props: Props) {
  const { anchor } = props;
  const { t } = useTranslation();
  // states
  const [uploadedAssetIds, setUploadAssetIds] = useState<string[]>([]);
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { peekId: issueId, addIssueComment, uploadCommentAsset } = useIssueDetails();
  const { data: currentUser } = useUser();
  const { workspace: workspaceID } = usePublish(anchor);
  // form info
  const {
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
    reset,
  } = useForm<TIssuePublicComment>({ defaultValues });

  const onSubmit = async (formData: TIssuePublicComment) => {
    if (!anchor || !issueId || isSubmitting || !formData.comment_html) return;

    try {
      const res = await addIssueComment(anchor, issueId, formData);
      reset(defaultValues);
      editorRef.current?.clearEditor();
      if (uploadedAssetIds.length > 0) {
        await fileService.updateBulkAssetsUploadStatus(anchor, res.id, {
          asset_ids: uploadedAssetIds,
        });
        setUploadAssetIds([]);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("localized_ui.space_public.comment_post_error"),
      });
    }
  };

  // TODO: on click if he user is not logged in redirect to login page
  return (
    <div>
      <div className="issue-comments-section">
        <Controller
          name="comment_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <LiteTextEditor
              editable
              onEnterKeyPress={(e) => {
                if (currentUser) handleSubmit(onSubmit)(e);
              }}
              anchor={anchor}
              workspaceId={workspaceID?.toString() ?? ""}
              ref={editorRef}
              id="peek-overview-add-comment"
              initialValue={
                !value || value === "" || (typeof value === "object" && Object.keys(value).length === 0)
                  ? watch("comment_html")
                  : value
              }
              onChange={(comment_json, comment_html) => onChange(comment_html)}
              isSubmitting={isSubmitting}
              placeholder={t("localized_ui.space_public.add_comment")}
              uploadFile={async (blockId, file) => {
                const { asset_id } = await uploadCommentAsset(file, anchor);
                setUploadAssetIds((prev) => [...prev, asset_id]);
                return asset_id;
              }}
              displayConfig={{
                fontSize: "small-font",
              }}
            />
          )}
        />
      </div>
    </div>
  );
});
