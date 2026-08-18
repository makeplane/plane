/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { gitsyncService, testhubService } from "@plane/services";
import type { TGitSyncModuleKey } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, Spinner } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
import { testhubErrorMessage } from "../helpers/error-message";

type Props = {
  path: string;
  moduleKey?: TGitSyncModuleKey;
  showCopy?: boolean;
};

export function FilePreviewButton({ path, moduleKey, showCopy }: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");

  const loadFile = async () => {
    if (!workspaceSlug || !projectId) return { content: "" };
    return moduleKey
      ? gitsyncService.getModuleFile(workspaceSlug, projectId, moduleKey, path)
      : testhubService.getFile(workspaceSlug, projectId, path);
  };

  const openFile = async () => {
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const data = await loadFile();
      setContent(data.content);
    } catch (err) {
      setError(testhubErrorMessage(err, t("testhub.api.load_error")));
    } finally {
      setLoading(false);
    }
  };

  const copyFile = async (text?: string) => {
    setCopying(true);
    try {
      const payload = text ?? (await loadFile()).content;
      await copyTextToClipboard(payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("testhub.api.copied"),
      });
    } catch (err) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("testhub.api.copy"),
        message: testhubErrorMessage(err, t("testhub.api.load_error")),
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <>
      <span className="inline-flex shrink-0 items-center gap-2">
        {showCopy ? (
          <Button variant="secondary" size="sm" onClick={() => void copyFile()} loading={copying} disabled={copying}>
            {t("testhub.api.copy")}
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" onClick={() => void openFile()}>
          {t("testhub.file.expand")}
        </Button>
      </span>
      <ModalCore
        isOpen={open}
        handleClose={() => setOpen(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XXXXL}
      >
        <div className="flex max-h-[80vh] flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-13 font-medium text-primary">{path}</p>
            <span className="inline-flex shrink-0 items-center gap-2">
              {showCopy && content && !loading && !error ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void copyFile(content)}
                  loading={copying}
                  disabled={copying}
                >
                  {t("testhub.api.copy")}
                </Button>
              ) : null}
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                {t("testhub.file.close")}
              </Button>
            </span>
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
