/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
// plane imports
import { RichTextEditorWithRef } from "@plane/editor";
import type { EditorRefApi, TFileHandler } from "@plane/editor";
import { cn } from "@plane/utils";
// helpers
import { getHelpEditorFileHandler } from "@/helpers/editor.helper";
// local imports
import { HelpEditorToolbar } from "./help-editor-toolbar";

type Props = {
  id: string;
  initialValue: string;
  editable: boolean;
  onChange?: (descriptionHtml: string, descriptionJson: object) => void;
  uploadFile?: TFileHandler["upload"];
  placeholder?: string;
};

const NOOP_UPLOAD: TFileHandler["upload"] = async () => "";

// Tiptap WYSIWYG for help articles. Self-contained: it owns the editor ref and
// drives an always-visible toolbar (editable) — no mentions, no workspace scope.
// Read-only (editable=false) renders exactly what the public reader shows.
export function HelpRichTextEditor({ id, initialValue, editable, onChange, uploadFile, placeholder }: Props) {
  const editorRef = useRef<EditorRefApi>(null);
  // Hold the editor API in state (set from the ready callback, not read during
  // render) so the toolbar re-renders once the editor mounts.
  const [editorApi, setEditorApi] = useState<EditorRefApi | null>(null);

  return (
    <div
      className={cn("rounded-md", {
        "border border-subtle bg-layer-2": editable,
      })}
    >
      {editable && <HelpEditorToolbar editorRef={editorApi} />}
      <RichTextEditorWithRef
        ref={editorRef}
        id={id}
        initialValue={initialValue || "<p></p>"}
        editable={editable}
        handleEditorReady={(ready) => setEditorApi(ready ? editorRef.current : null)}
        onChange={(json, html) => onChange?.(html, json)}
        fileHandler={getHelpEditorFileHandler({ uploadFile: editable ? (uploadFile ?? NOOP_UPLOAD) : NOOP_UPLOAD })}
        getEditorMetaData={() => ({ file_assets: [], user_mentions: [] })}
        mentionHandler={{ renderComponent: () => null }}
        disabledExtensions={[]}
        flaggedExtensions={[]}
        extendedEditorProps={{}}
        placeholder={placeholder}
        containerClassName={cn("relative", { "px-3 pb-3": editable, "p-0": !editable })}
        editorClassName={editable ? "min-h-[240px]" : ""}
      />
    </div>
  );
}
