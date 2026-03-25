/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState, useRef, useCallback } from "react";
import { Code2, Maximize2 } from "lucide-react";
// components
import { FunctionBrowserModal } from "@/components/runners/function-browser";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { EModalWidth, Loader, ModalCore } from "@plane/ui";
import { LazyEditor } from "./editor";

type Props = {
  value: string;
  readOnly?: boolean;
  isLoading?: boolean;
  onChange: (value: string) => void;
  allowFunctionBrowser?: boolean;
};

export const LazyPlaneSDKCodeEditor = function LazyPlaneSDKCodeEditor(props: Props) {
  const { value, onChange, allowFunctionBrowser = false, readOnly = false, isLoading = false } = props;
  const [showFunctionBrowser, setShowFunctionBrowser] = useState(false);
  const [showFullScreenEditor, setShowFullScreenEditor] = useState(false);
  const editorRef = useRef<{ editor: unknown; monaco: unknown } | null>(null);

  const handleInsertFunction = useCallback(
    (code: string) => {
      // Insert code at cursor position or append to end
      const editor = editorRef.current?.editor as {
        getPosition?: () => { lineNumber: number; column: number } | null;
        executeEdits?: (source: string, edits: { range: unknown; text: string }[]) => void;
        getModel?: () => { getFullModelRange?: () => unknown } | null;
      } | null;
      const monaco = editorRef.current?.monaco as {
        Range?: new (startLine: number, startCol: number, endLine: number, endCol: number) => unknown;
      } | null;

      if (editor?.getPosition && editor?.executeEdits && monaco?.Range) {
        const position = editor.getPosition();
        if (position) {
          const range = new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column);
          editor.executeEdits("function-browser", [
            {
              range,
              text: code,
            },
          ]);
        }
      } else {
        // Fallback: append to end of value
        onChange(value + "\n" + code);
      }
    },
    [value, onChange]
  );

  const addFunctionCTA = (
    <Button
      prependIcon={<Code2 className="size-3.5 text-icon-secondary" />}
      type="button"
      onClick={() => setShowFunctionBrowser(true)}
      variant="secondary"
      title="Insert Function (Cmd+Shift+F)"
      disabled={readOnly}
    >
      Functions
    </Button>
  );
  if (isLoading) {
    return (
      <div className="relative">
        <Loader className="w-full">
          <Loader.Item height="350px" width="100%" />
        </Loader>
      </div>
    );
  }
  return (
    <div className="relative">
      <LazyEditor
        key={showFullScreenEditor ? "fullscreen" : "inline"}
        value={value}
        onChange={onChange}
        allowFunctionBrowser={allowFunctionBrowser}
        setShowFunctionBrowser={setShowFunctionBrowser}
        readOnly={readOnly}
      />
      <div className="absolute flex items-center gap-2 top-2 right-2">
        {/* Function Browser Button */}
        {allowFunctionBrowser && addFunctionCTA}
        <IconButton icon={Maximize2} onClick={() => setShowFullScreenEditor(true)} variant="secondary" size="base" />
      </div>
      {/* Function Browser Modal */}
      {allowFunctionBrowser && (
        <FunctionBrowserModal
          isOpen={showFunctionBrowser}
          onClose={() => setShowFunctionBrowser(false)}
          onInsert={handleInsertFunction}
        />
      )}
      <ModalCore
        isOpen={showFullScreenEditor}
        width={EModalWidth.VIIXL}
        handleClose={() => setShowFullScreenEditor(false)}
      >
        <div className="p-6 relative">
          {showFullScreenEditor && (
            <LazyEditor
              key="fullscreen"
              value={value}
              onChange={onChange}
              allowFunctionBrowser={allowFunctionBrowser}
              setShowFunctionBrowser={setShowFunctionBrowser}
              isFullScreen
              readOnly={readOnly}
            />
          )}
          <div className="absolute flex items-center gap-2 top-2 right-2">
            {/* Function Browser Button */}
            {allowFunctionBrowser && addFunctionCTA}
          </div>
        </div>
      </ModalCore>
    </div>
  );
};
