import { useEffect, useMemo, useState } from "react";

import { MediaLibraryService } from "@/services/media-library.service";
import type { TMediaArtifact } from "@/services/media-library.service";
import type { TWebhookArtifact } from "./webhook-artifacts-types";
import { inferFormatFromPath, resolveManifestMeta, resolveOpenUrl, resolveWebhookArtifactType, toTimestamp } from "./webhook-artifacts-utils";

type TUseWebhookArtifactsDataProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const useWebhookArtifactsData = ({ workspaceSlug, projectId, issueId }: TUseWebhookArtifactsDataProps) => {
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);
  const [artifacts, setArtifacts] = useState<TWebhookArtifact[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const loadWebhookArtifacts = async () => {
      if (!workspaceSlug || !projectId || !issueId) {
        if (!isCancelled) setArtifacts([]);
        return;
      }

      if (!isCancelled) {
        setArtifacts([]);
      }

      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const packageId = typeof manifest?.id === "string" ? manifest.id : "";
        if (!packageId) {
          if (!isCancelled) setArtifacts([]);
          return;
        }

        const manifestArtifacts: TMediaArtifact[] = Array.isArray(manifest?.artifacts) ? manifest.artifacts : [];
        const manifestMetadata =
          manifest && typeof manifest === "object" && manifest.metadata && typeof manifest.metadata === "object"
            ? (manifest.metadata as Record<string, Record<string, unknown>>)
            : undefined;

        const nextArtifacts = manifestArtifacts
          .filter((artifact) => {
            const name = artifact.name?.trim() ?? "";
            if (!name) return false;

            const format = (artifact.format || "").toLowerCase();
            if (format === "thumbnail") return false;

            const meta = resolveManifestMeta(artifact, manifestMetadata);
            const source = typeof meta.source === "string" ? meta.source.toLowerCase().trim() : "";
            if (source !== "webhook") return false;

            const artifactWorkItemId = artifact.work_item_id ?? "";
            const metaWorkItemId = typeof meta.work_item_id === "string" ? meta.work_item_id : "";
            if (artifactWorkItemId) return artifactWorkItemId === issueId;
            if (metaWorkItemId) return metaWorkItemId === issueId;
            return false;
          })
          .sort(
            (a, b) =>
              toTimestamp((b.updated_at as string) || (b.created_at as string)) -
              toTimestamp((a.updated_at as string) || (a.created_at as string))
          )
          .map((artifact) => {
            const name = artifact.name ?? "";
            const title = artifact.title?.trim() ? artifact.title : name || "Webhook asset";
            const action = artifact.action || "";
            const path = artifact.path || "";
            const openUrl = resolveOpenUrl(path, workspaceSlug, projectId, packageId, name);
            const inferredFormat = inferFormatFromPath(path) || inferFormatFromPath(openUrl) || "file";
            const format = (artifact.format || inferredFormat || "file").toLowerCase();
            const mediaType = resolveWebhookArtifactType(format, action, path, openUrl);

            return {
              id: name || `${title}-${openUrl}`,
              title,
              format,
              action,
              path: path || openUrl,
              openUrl,
              mediaType,
            };
          });

        if (!isCancelled) {
          setArtifacts(nextArtifacts);
        }
      } catch {
        if (!isCancelled) {
          setArtifacts([]);
        }
      }
    };

    void loadWebhookArtifacts();

    return () => {
      isCancelled = true;
    };
  }, [issueId, mediaLibraryService, projectId, workspaceSlug]);

  return {
    artifacts,
  };
};
