/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import type { TFileHandler } from "@plane/editor";
import { HelpPreviewContent } from "./help-preview-content";
import { HelpRichTextEditor } from "./help-rich-text-editor";

type CopyOption = { locale: string; label: string };

type Props = {
  articleId: string;
  locale: string;
  editorKey: number;
  title: string;
  descriptionHtml: string;
  isSaving: boolean;
  copyOptions: CopyOption[];
  uploadFile: TFileHandler["upload"];
  onTitleChange: (title: string) => void;
  onContentChange: (html: string, json: object) => void;
  onCopyFrom: (sourceLocale: string) => void;
  onSave: () => void;
};

const isEmptyHtml = (html: string) => !html || html === "<p></p>" || html.trim() === "";

export function TranslationLocaleEditor({
  articleId,
  locale,
  editorKey,
  title,
  descriptionHtml,
  isSaving,
  copyOptions,
  uploadFile,
  onTitleChange,
  onContentChange,
  onCopyFrom,
  onSave,
}: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const showCopyRow = !title.trim() && isEmptyHtml(descriptionHtml) && copyOptions.length > 0;

  return (
    <div className="space-y-3">
      {showCopyRow && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-subtle bg-surface-2 px-3 py-2">
          <span className="text-12 text-tertiary">This language is empty. Copy from:</span>
          {copyOptions.map((option) => (
            <Button key={option.locale} variant="secondary" size="sm" onClick={() => onCopyFrom(option.locale)}>
              {option.label}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor={`title-${locale}`} className="block text-13 font-medium text-primary">
          Title
        </label>
        <Input
          id={`title-${locale}`}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Article title"
          className="w-full bg-layer-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-13 font-medium text-primary">Content</span>
        <Button variant="ghost" size="sm" onClick={() => setShowPreview((prev) => !prev)}>
          {showPreview ? <Pencil className="size-3.5" /> : <Eye className="size-3.5" />}
          {showPreview ? "Edit" : "Preview"}
        </Button>
      </div>

      {showPreview ? (
        <div className="rounded-md border border-subtle bg-surface-1 p-4">
          <HelpPreviewContent>
            <HelpRichTextEditor
              id={`preview-${articleId}-${locale}-${editorKey}`}
              key={`preview-${editorKey}`}
              editable={false}
              initialValue={descriptionHtml}
            />
          </HelpPreviewContent>
        </div>
      ) : (
        <HelpRichTextEditor
          id={`editor-${articleId}-${locale}-${editorKey}`}
          key={`editor-${editorKey}`}
          editable
          initialValue={descriptionHtml}
          uploadFile={uploadFile}
          onChange={onContentChange}
          placeholder="Write the article content…"
        />
      )}

      <div className="flex justify-end">
        <Button variant="primary" size="sm" loading={isSaving} onClick={onSave}>
          Save {locale.toUpperCase()}
        </Button>
      </div>
    </div>
  );
}
