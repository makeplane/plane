"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// plane editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// components
import { EditorVersionHistoryOverlay, IssueVersionEditor } from "@/components/editor";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";
// services
import { IssueVersionService } from "@/services/issue";
const issueVersionService = new IssueVersionService();

type Props = {
  disabled: boolean;
  editorRef: EditorRefApi;
  issueId: string;
  readOnlyEditorRef: EditorReadOnlyRefApi;
};

export const IssueVersionHistory: React.FC<Props> = (props) => {
  const { disabled, editorRef, issueId, readOnlyEditorRef } = props;
  // states
  const [isVersionsOverlayOpen, setIsVersionsOverlayOpen] = useState(false);
  // search params
  const searchParams = useSearchParams();
  // params
  const { projectId, workspaceSlug } = useParams();
  // router
  const router = useRouter();
  // update query params
  const { updateQueryParams } = useQueryParams();

  const version = searchParams.get("version");
  useEffect(() => {
    if (!version) {
      setIsVersionsOverlayOpen(false);
      return;
    }
    setIsVersionsOverlayOpen(true);
  }, [version]);

  const handleCloseVersionsOverlay = () => {
    const updatedRoute = updateQueryParams({
      paramsToRemove: ["version"],
    });
    router.push(updatedRoute);
  };

  const handleRestoreVersion = async (descriptionHTML: string) => {
    editorRef?.clearEditor();
    editorRef?.setEditorValue(descriptionHTML);
  };
  const currentVersionDescription = disabled ? readOnlyEditorRef?.getDocument().html : editorRef?.getDocument().html;

  return (
    <EditorVersionHistoryOverlay
      activeVersion={version}
      currentVersionDescription={currentVersionDescription ?? null}
      editorComponent={IssueVersionEditor}
      entityId={issueId}
      fetchAllVersions={async (issueId) => {
        if (!workspaceSlug || !projectId) return;
        return await issueVersionService.fetchAllVersions(workspaceSlug.toString(), projectId.toString(), issueId);
      }}
      fetchVersionDetails={async (issueId, versionId) => {
        if (!workspaceSlug || !projectId) return;
        return await issueVersionService.fetchVersionById(
          workspaceSlug.toString(),
          projectId.toString(),
          issueId,
          versionId
        );
      }}
      handleRestore={handleRestoreVersion}
      isOpen={isVersionsOverlayOpen}
      onClose={handleCloseVersionsOverlay}
      restoreEnabled={!disabled}
    />
  );
};
