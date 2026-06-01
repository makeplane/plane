/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { MAX_FILE_SIZE } from "@plane/constants";
import { RichTextEditorWithRef } from "@plane/editor";
import type { TFileHandler } from "@plane/editor";
import { getFileURL } from "@plane/utils";
import { HelpImageLightbox } from "./help-image-lightbox";

type Props = {
  articleId: string;
  descriptionHtml: string;
};

// Help images are instance-global (no workspace), so resolve a bare asset id to
// the workspace-agnostic public static endpoint. The standalone /help reader has
// NO workspace context — use the raw @plane/editor editor with a help-only file
// handler instead of the workspace-scoped web wrapper.
const resolveHelpAssetSrc = async (path: string): Promise<string> => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return getFileURL(path) ?? path;
  return getFileURL(`/api/assets/v2/static/${path}/`) ?? "";
};

const READ_ONLY_FILE_HANDLER: TFileHandler = {
  assetsUploadStatus: {},
  checkIfAssetExists: async () => true,
  getAssetSrc: resolveHelpAssetSrc,
  getAssetDownloadSrc: resolveHelpAssetSrc,
  upload: async () => "",
  delete: async () => {},
  restore: async () => {},
  cancel: () => {},
  duplicate: async (assetId: string) => assetId,
  validation: { maxFileSize: MAX_FILE_SIZE },
};

// Reader trusts the sanitized `description_html` only (never json).
export function HelpContentRenderer({ articleId, descriptionHtml }: Props) {
  return (
    <HelpImageLightbox>
      <RichTextEditorWithRef
        key={articleId}
        id={articleId}
        editable={false}
        initialValue={descriptionHtml}
        disabledExtensions={[]}
        flaggedExtensions={[]}
        extendedEditorProps={{}}
        fileHandler={READ_ONLY_FILE_HANDLER}
        getEditorMetaData={() => ({ file_assets: [], user_mentions: [] })}
        mentionHandler={{ renderComponent: () => null }}
        containerClassName="p-0 !pl-0 border-none"
        editorClassName="pl-0"
      />
    </HelpImageLightbox>
  );
}
