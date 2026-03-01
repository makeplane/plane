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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { ArrowUp } from "lucide-react";
import type { TPiChatEditorRefApi } from "@plane/editor";
import { PiChatEditorWithRef } from "@plane/editor";
import { FilledCheck, FilledCross } from "@plane/propel/icons";
import { cn } from "@plane/ui";
import { isCommentEmpty } from "@plane/utils";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";
import useEvent from "@/plane-web/hooks/use-event";
import type { TUpdatedArtifact } from "@/types";
import { useArtifactData } from "../useArtifactData";

type TProps = {
  projectId?: string | undefined;
  workspaceId: string;
  workspaceSlug: string;
  activeChatId: string;
  artifactId: string;
  messageId: string;
  artifactType: string;
  onSubmit?: (artifactData: TUpdatedArtifact) => void;
};

type TEditCommands = {
  getHTML: () => string;
  clear: () => void;
};

export const FollowUpDetail = observer(function FollowUpDetail(props: TProps) {
  const { projectId, workspaceId, artifactId, messageId, artifactType, onSubmit } = props;
  // states
  const [isThinking, setIsThinking] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  //ref
  const editorCommands = useRef<TEditCommands | null>(null);
  const editorRef = useRef<TPiChatEditorRefApi>(null);
  // store hooks
  const { followUp, activeChatId } = usePiChat();
  // hooks
  const artifactData = useArtifactData(artifactId, artifactType);
  const setEditorCommands = (command: TEditCommands) => {
    editorCommands.current = command;
  };

  const handleSubmit = useEvent(async (e?: React.FormEvent) => {
    const query = editorCommands.current?.getHTML();
    e?.preventDefault();
    if (isThinking || !query || isCommentEmpty(query) || !workspaceId) return;
    setIsThinking(true);
    await followUp(artifactId, query, messageId, projectId, workspaceId, activeChatId, artifactType, artifactData)
      .then((response) => {
        if (response.success) {
          setShowAlert(true);
          onSubmit?.(response.artifact_data);
        }
        return;
      })
      .catch((error) => {
        console.error(error);
        setShowAlert(true);
        if (typeof error === "string") {
          setError(error);
        } else {
          setError("Something went wrong. Please try again.");
        }
      })
      .finally(() => {
        editorCommands.current?.clear();
        setIsThinking(false);
        setTimeout(() => {
          setShowAlert(false);
          setError(null);
        }, 2000);
      });
  });
  return (
    <div className="w-fit rounded-xl shadow-overlay-100 border border-subtle bg-layer-2 text-14 p-2 flex items-center transition-all duration-300 ease-in-out">
      {/* Follow Up input */}
      {!isThinking && !showAlert && (
        <div className="flex justify-between items-end gap-2 w-[300px]">
          <div className="max-h-[100px] overflow-scroll my-auto flex-1">
            <PiChatEditorWithRef
              setEditorCommand={(command: TEditCommands) => {
                setEditorCommands({ ...command });
              }}
              handleSubmit={() => void handleSubmit()}
              className={cn("flex-1")}
              ref={editorRef}
              placeholder="Ask Plane AI to edit"
            />
          </div>
          <button
            className="rounded-full bg-accent-primary text-on-color size-8 flex items-center justify-center flex-shrink-0 disabled:bg-accent-primary/10"
            type="submit"
            onClick={() => void handleSubmit()}
            disabled={false}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      )}
      {/* thinking */}
      {isThinking && (
        <div className="flex items-center gap-2 p-1 w-full text-nowrap">
          <div className="w-2 h-4 rounded-[1px] bg-inverse animate-vertical-scale" />
          <div className="flex gap-2 items-center text-body-sm-regular text-secondary">Taking required actions</div>
        </div>
      )}
      {/* alert */}
      {showAlert && (
        <div className="w-full flex justify-center items-center gap-2 text-body-sm-regular text-primary p-1 text-nowrap">
          {error ? (
            <FilledCross width={16} height={16} />
          ) : (
            <FilledCheck width={16} height={16} className="text-success-primary" />
          )}
          <div>{error || "All requested changes are done."}</div>
        </div>
      )}
    </div>
  );
});
