/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, EditorContainer, EditorContentWrapper } from "@/components/editors";
import { BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import type { TCollabValue } from "@/contexts";
import type {
  ICollaborativeDocumentEditorPropsExtended,
  IEditorProps,
  IEditorPropsExtended,
  TAIHandler,
  TDisplayConfig,
} from "@/types";

type Props = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  disabledExtensions: IEditorProps["disabledExtensions"];
  displayConfig: TDisplayConfig;
  documentLoaderClassName?: string;
  editor: Editor;
  titleEditor?: Editor;
  editorContainerClassName: string;
  extendedDocumentEditorProps?: ICollaborativeDocumentEditorPropsExtended;
  extendedEditorProps: IEditorPropsExtended;
  flaggedExtensions: IEditorProps["flaggedExtensions"];
  id: string;
  isLoading?: boolean;
  isTouchDevice: boolean;
  tabIndex?: number;
  provider?: HocuspocusProvider;
  state?: TCollabValue["state"];
};

export function PageRenderer(props: Props) {
  const {
    bubbleMenuEnabled,
    disabledExtensions,
    displayConfig,
    documentLoaderClassName,
    editor,
    editorContainerClassName,
    extendedEditorProps,
    flaggedExtensions,
    id,
    isLoading,
    isTouchDevice,
    tabIndex,
    titleEditor,
    provider,
    state,
  } = props;
  return (
    <div
      className={cn("frame-renderer w-full flex-grow", {
        "wide-layout": displayConfig.wideLayout,
      })}
    >
      {isLoading ? (
        <DocumentContentLoader className={documentLoaderClassName} />
      ) : (
        <>
          {titleEditor && (
            <div className="relative w-full py-3">
              <EditorContainer
                editor={titleEditor}
                id={id + "-title"}
                isTouchDevice={isTouchDevice}
                editorContainerClassName="page-title-editor bg-transparent py-3 border-none"
                displayConfig={displayConfig}
              >
                <EditorContentWrapper
                  editor={titleEditor}
                  id={id + "-title"}
                  tabIndex={tabIndex}
                  className="no-scrollbar placeholder-placeholder w-full resize-none rounded-none border-none bg-transparent p-0 text-[2rem] leading-[2.375rem] font-bold tracking-[-2%] outline-none"
                />
              </EditorContainer>
            </div>
          )}
          <EditorContainer
            displayConfig={displayConfig}
            editor={editor}
            editorContainerClassName={editorContainerClassName}
            id={id}
            isTouchDevice={isTouchDevice}
            provider={provider}
            state={state}
          >
            <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
            {editor.isEditable && !isTouchDevice && (
              <div>
                {bubbleMenuEnabled && (
                  <EditorBubbleMenu
                    editor={editor}
                    disabledExtensions={disabledExtensions}
                    extendedEditorProps={extendedEditorProps}
                    flaggedExtensions={flaggedExtensions}
                  />
                )}
                <BlockMenu
                  editor={editor}
                  flaggedExtensions={flaggedExtensions}
                  disabledExtensions={disabledExtensions}
                />
              </div>
            )}
          </EditorContainer>
        </>
      )}
    </div>
  );
}
