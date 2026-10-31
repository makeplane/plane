/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { FILE_ACCEPT, MAX_FILE_MB, fileLimitError } from "@plane/services";
import { setToast } from "@plane/blocks/toast";
import { useUser } from "@/hooks/store/user";
import { hubService, hubExtraService, useHubFiles } from "@/hooks/team-ops/use-hub";
// local imports
import { getErrorMessage } from "../calendar/error-message";

type Props = { workspaceSlug: string };

const dateFormat = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" });
const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Files shared with the whole workspace, and the files of the channels the person is in. */
export const FilesView = observer(function FilesView({ workspaceSlug }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { data: currentUser } = useUser();
  const { files, refresh } = useHubFiles(workspaceSlug);

  const upload = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const chosen = Array.from(list);
    const problem = fileLimitError(chosen);
    if (problem) return setToast({ type: "error", title: "Could not upload", message: problem });
    setIsUploading(true);
    try {
      await hubExtraService.uploadFiles(workspaceSlug, chosen);
      await refresh();
    } catch (error) {
      setToast({ type: "error", title: "Could not upload", message: getErrorMessage(error) });
    } finally {
      setIsUploading(false);
      if (input.current) input.current.value = "";
    }
  };

  const open = async (id: string) => {
    try {
      const { url } = await hubService.getFileLink(workspaceSlug, id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setToast({ type: "error", title: "Could not open the file", message: getErrorMessage(error) });
    }
  };

  const remove = async (id: string) => {
    try {
      await hubExtraService.deleteFile(workspaceSlug, id);
      await refresh();
    } catch (error) {
      setToast({ type: "error", title: "Could not remove", message: getErrorMessage(error) });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-4 py-3">
        <div>
          <h2 className="text-body-md-medium text-primary">Files</h2>
          <p className="text-caption-sm-regular text-tertiary">
            Shared files are visible to everyone in the workspace. Files from your channels appear here too. Up to{" "}
            {MAX_FILE_MB} MB each; links open for 5 minutes.
          </p>
        </div>
        <div>
          <input
            ref={input}
            id="library-files"
            type="file"
            multiple
            accept={FILE_ACCEPT}
            className="sr-only"
            onChange={(event) => void upload(event.target.files)}
          />
          <label
            htmlFor="library-files"
            className="cursor-pointer rounded-md bg-accent-primary px-3 py-2 text-body-xs-medium text-on-color"
          >
            {isUploading ? "Uploading..." : "Share files"}
          </label>
        </div>
      </header>
      <ul className="min-h-0 flex-1 divide-y divide-subtle overflow-y-auto">
        {(files ?? []).length === 0 ? (
          <li className="px-4 py-6 text-center text-body-sm-regular text-tertiary">No files yet.</li>
        ) : null}
        {(files ?? []).map((file) => (
          <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0">
              <button
                type="button"
                className="truncate text-body-sm-medium text-accent-primary hover:underline"
                onClick={() => void open(file.id)}
              >
                {file.name}
              </button>
              <p className="text-caption-sm-regular text-tertiary">
                {formatSize(file.size)} · {file.uploaded_by.display_name} ·{" "}
                {dateFormat.format(new Date(file.created_at))} · {file.source}
              </p>
            </div>
            {file.source === "Library" && file.uploaded_by.id === currentUser?.id ? (
              <button
                type="button"
                className="text-body-xs-regular text-tertiary hover:text-danger-primary"
                onClick={() => void remove(file.id)}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
});
