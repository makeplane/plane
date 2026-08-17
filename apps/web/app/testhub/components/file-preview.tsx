/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { gitsyncService, testhubService } from "@plane/services";
import type { TGitSyncModuleKey } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, Spinner } from "@plane/ui";
import { testhubErrorMessage } from "../helpers/error-message";

export function FilePreviewButton({ path, moduleKey }: { path: string; moduleKey?: TGitSyncModuleKey }) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openFile = async () => {
    if (!workspaceSlug || !projectId) return;
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const data = moduleKey
        ? await gitsyncService.getModuleFile(workspaceSlug, projectId, moduleKey, path)
        : await testhubService.getFile(workspaceSlug, projectId, path);
      setContent(data.content);
    } catch (err) {
      setError(testhubErrorMessage(err, t("testhub.api.load_error")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={openFile}>
        {t("testhub.knowledge.open")}
      </Button>
      <ModalCore
        isOpen={open}
        handleClose={() => setOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXXXL}
      >
        <div className="flex max-h-[80vh] flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-13 font-medium text-primary">{path}</p>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              {t("testhub.file.close")}
            </Button>
          </div>
          <pre className="min-h-40 flex-1 overflow-auto rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-secondary">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner height="16px" width="16px" />
                {t("testhub.file.loading")}
              </span>
            ) : (
              error || content
            )}
          </pre>
        </div>
      </ModalCore>
    </>
  );
}
