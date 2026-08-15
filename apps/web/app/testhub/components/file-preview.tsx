/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { testhubService } from "@plane/services";
import { Button } from "@plane/ui";

export function FilePreviewButton({ path }: { path: string }) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const openFile = async () => {
    if (!workspaceSlug || !projectId) return;
    setOpen(true);
    setLoading(true);
    setError("");
    try {
      const data = await testhubService.getFile(workspaceSlug, projectId, path);
      setContent(data.content);
    } catch (err) {
      setError(
        typeof err === "object" && err && "error" in err ? String((err as { error: string }).error) : String(err)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="neutral-primary" size="sm" onClick={openFile}>
        {t("testhub.knowledge.open")}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            className="fixed inset-0 bg-backdrop"
            aria-label={t("testhub.file.close")}
            onClick={() => setOpen(false)}
          />
          <div className="shadow-lg relative z-10 flex max-h-[80vh] w-[min(800px,90vw)] flex-col rounded-lg bg-surface-1 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-13 text-primary">{path}</p>
              <Button variant="neutral-primary" size="sm" onClick={() => setOpen(false)}>
                {t("testhub.file.close")}
              </Button>
            </div>
            <pre className="flex-1 overflow-auto rounded-md bg-layer-1 p-3 text-12 whitespace-pre-wrap text-secondary">
              {loading ? "…" : error || content}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
