/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CornerDownRight, RefreshCcw, Sparkles, TriangleAlert } from "lucide-react";
// plane editor
import type { EditorRefApi } from "@plane/editor";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane ui
import { Tooltip } from "@plane/propel/tooltip";
// components
import { cn } from "@plane/utils";
import { RichTextEditor } from "@/components/editor/rich-text";
// plane web constants
import { AI_EDITOR_TASKS, LOADING_TEXTS } from "@/constants/ai";
// plane web services
import type { TTaskPayload } from "@/services/ai.service";
import { AIService } from "@/services/ai.service";
import { AskPiMenu } from "./ask-pi-menu";
const aiService = new AIService();

type Props = {
  editorRef: EditorRefApi | null;
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceSlug: string;
};

const MENU_ITEMS: {
  icon: LucideIcon;
  key: AI_EDITOR_TASKS;
  label: string;
}[] = [
  {
    key: AI_EDITOR_TASKS.ASK_ANYTHING,
    icon: Sparkles,
    label: "Ask Pi",
  },
];

const TONES_LIST = [
  {
    key: "default",
    label: "Default",
    casual_score: 5,
    formal_score: 5,
  },
  {
    key: "professional",
    label: "💼 Professional",
    casual_score: 0,
    formal_score: 10,
  },
  {
    key: "casual",
    label: "😃 Casual",
    casual_score: 10,
    formal_score: 0,
  },
];

export function EditorAIMenu(props: Props) {
  const { editorRef, isOpen, onClose, workspaceId, workspaceSlug } = props;
  // states
  const [activeTask, setActiveTask] = useState<AI_EDITOR_TASKS | null>(null);
  const [response, setResponse] = useState<string | undefined>(undefined);
  const [isRegenerating, setIsRegenerating] = useState(false);
  // refs
  const responseContainerRef = useRef<HTMLDivElement>(null);
  // params
  const handleGenerateResponse = async (payload: TTaskPayload) => {
    if (!workspaceSlug) return;
    await aiService.performEditorTask(workspaceSlug.toString(), payload).then((res) => setResponse(res.response));
  };
  // handle task click
  const handleClick = async (key: AI_EDITOR_TASKS) => {
    const selection = editorRef?.getSelectedText();
    if (!selection || activeTask === key) return;
    setActiveTask(key);
    if (key === AI_EDITOR_TASKS.ASK_ANYTHING) return;
    setResponse(undefined);
    setIsRegenerating(false);
    await handleGenerateResponse({
      task: key,
      text_input: selection,
    });
  };
  // handle re-generate response
  const handleRegenerate = async () => {
    const selection = editorRef?.getSelectedText();
    if (!selection || !activeTask) return;
    setIsRegenerating(true);
    await handleGenerateResponse({
      task: activeTask,
      text_input: selection,
    })
      .then(() =>
        responseContainerRef.current?.scrollTo({
          top: 0,
          behavior: "smooth",
        })
      )
      .finally(() => setIsRegenerating(false));
  };
  // handle re-generate response
  const handleToneChange = async (key: string) => {
    const selectedTone = TONES_LIST.find((t) => t.key === key);
    const selection = editorRef?.getSelectedText();
    if (!selectedTone || !selection || !activeTask) return;
    setResponse(undefined);
    setIsRegenerating(false);
    await handleGenerateResponse({
      casual_score: selectedTone.casual_score,
      formal_score: selectedTone.formal_score,
      task: activeTask,
      text_input: selection,
    }).then(() =>
      responseContainerRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    );
  };
  // handle replace selected text with the response
  const handleInsertText = (insertOnNextLine: boolean) => {
    if (!response) return;
    editorRef?.insertText(response, insertOnNextLine);
    onClose();
  };

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setActiveTask(null);
      setResponse(undefined);
    }
  }, [isOpen]);

  return (
    <div
      className={cn(
        "flex w-[210px] flex-col rounded-md border-[0.5px] border-strong bg-surface-1 shadow-raised-200 transition-all",
        {
          "w-[700px]": activeTask,
        }
      )}
    >
      <div
        className={cn("flex max-h-72 w-full", {
          "divide-x divide-subtle-1": activeTask,
        })}
      >
        <div className="w-[210px] flex-shrink-0 overflow-y-auto px-2 py-2.5 transition-all">
          {MENU_ITEMS.map((item) => {
            const isActiveTask = activeTask === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 text-11 text-secondary transition-colors hover:bg-layer-1",
                  {
                    "bg-layer-1": isActiveTask,
                  }
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClick(item.key);
                }}
              >
                <span className="flex flex-shrink-0 items-center gap-2 truncate">
                  <item.icon className="size-3 flex-shrink-0" />
                  {item.label}
                </span>
                <ChevronRightIcon
                  className={cn("pointer-events-none size-3 flex-shrink-0 opacity-0 transition-opacity", {
                    "pointer-events-auto opacity-100": isActiveTask,
                  })}
                />
              </button>
            );
          })}
        </div>
        <div
          ref={responseContainerRef}
          className={cn("w-0 flex-shrink-0 overflow-hidden transition-all", {
            "vertical-scrollbar scrollbar-sm w-[490px] overflow-auto": activeTask,
          })}
        >
          {activeTask === AI_EDITOR_TASKS.ASK_ANYTHING ? (
            <AskPiMenu
              handleInsertText={handleInsertText}
              handleRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
              response={response}
              workspaceSlug={workspaceSlug}
            />
          ) : (
            <>
              <div
                className={cn("flex items-center gap-3 px-4 py-3.5", {
                  "items-start": response,
                })}
              >
                <span className="grid size-7 flex-shrink-0 place-items-center rounded-full border border-subtle text-secondary">
                  <Sparkles className="size-3" />
                </span>
                {response ? (
                  <div>
                    <RichTextEditor
                      displayConfig={{
                        fontSize: "small-font",
                      }}
                      editable={false}
                      id="editor-ai-response"
                      initialValue={response}
                      containerClassName="!p-0 border-none"
                      editorClassName="!pl-0"
                      workspaceId={workspaceId}
                      workspaceSlug={workspaceSlug}
                    />
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        type="button"
                        className="rounded-sm p-1 text-13 font-medium text-tertiary outline-none hover:bg-layer-1"
                        onClick={() => handleInsertText(false)}
                      >
                        Replace selection
                      </button>
                      <Tooltip tooltipContent="Add to next line">
                        <button
                          type="button"
                          className="grid size-6 flex-shrink-0 place-items-center rounded-sm outline-none hover:bg-layer-1"
                          onClick={() => handleInsertText(true)}
                        >
                          <CornerDownRight className="size-4 text-tertiary" />
                        </button>
                      </Tooltip>
                      <Tooltip tooltipContent="Re-generate response">
                        <button
                          type="button"
                          className="grid size-6 flex-shrink-0 place-items-center rounded-sm outline-none hover:bg-layer-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRegenerate();
                          }}
                          disabled={isRegenerating}
                        >
                          <RefreshCcw
                            className={cn("size-4 text-tertiary", {
                              "animate-spin": isRegenerating,
                            })}
                          />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ) : (
                  <p className="text-13 text-secondary">
                    {activeTask ? LOADING_TEXTS[activeTask] : "Pi is writing"}...
                  </p>
                )}
              </div>
              <div className="sticky bottom-0 flex w-full items-center gap-2 bg-surface-1 py-2 pl-[54.8px]">
                {TONES_LIST.map((tone) => (
                  <button
                    key={tone.key}
                    type="button"
                    className={cn(
                      "rounded-sm bg-layer-1 p-1 text-11 font-medium text-secondary transition-colors outline-none",
                      {
                        "bg-accent-primary/20 text-accent-primary": tone.key === "default",
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToneChange(tone.key);
                    }}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      {activeTask && (
        <div className="flex items-center gap-2 rounded-b-md border-t border-subtle bg-surface-2 px-4 py-2 text-tertiary">
          <span className="grid size-4 flex-shrink-0 place-items-center">
            <TriangleAlert className="size-3" />
          </span>
          <p className="flex-shrink-0 text-11 font-medium">
            By using this feature, you consent to sharing the message with a 3rd party service.
          </p>
        </div>
      )}
    </div>
  );
}
