"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Globe2, Lock, LucideIcon } from "lucide-react";
// editor
import { EditorMenuItemNames, EditorRefApi } from "@plane/editor";
// ui
import { Button, Tooltip } from "@plane/ui";
// constants
import { TOOLBAR_ITEMS } from "@/constants/editor";
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  accessSpecifier?: EIssueCommentAccessSpecifier;
  executeCommand: (commandName: EditorMenuItemNames) => void;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  handleSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isCommentEmpty: boolean;
  isSubmitting: boolean;
  showAccessSpecifier: boolean;
  showSubmitButton: boolean;
  editorRef: React.MutableRefObject<EditorRefApi | null> | null;
};

type TCommentAccessType = {
  icon: LucideIcon;
  key: EIssueCommentAccessSpecifier;
  label: "Private" | "Public";
};

const COMMENT_ACCESS_SPECIFIERS: TCommentAccessType[] = [
  {
    icon: Lock,
    key: EIssueCommentAccessSpecifier.INTERNAL,
    label: "Private",
  },
  {
    icon: Globe2,
    key: EIssueCommentAccessSpecifier.EXTERNAL,
    label: "Public",
  },
];

const toolbarItems = TOOLBAR_ITEMS.lite;

export const IssueCommentToolbar: React.FC<Props> = (props) => {
  const {
    accessSpecifier,
    executeCommand,
    handleAccessChange,
    handleSubmit,
    isCommentEmpty,
    isSubmitting,
    showAccessSpecifier,
    showSubmitButton,
    editorRef,
  } = props;

  // State to manage active states of toolbar items
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});

  // Function to update active states
  const updateActiveStates = useCallback(() => {
    if (editorRef?.current) {
      const newActiveStates: Record<string, boolean> = {};
      Object.values(toolbarItems)
        .flat()
        .forEach((item) => {
          // Assert that editorRef.current is not null
          newActiveStates[item.key] = (editorRef.current as EditorRefApi).isMenuItemActive(item.key);
        });
      setActiveStates(newActiveStates);
    }
  }, [editorRef]);

  // useEffect to call updateActiveStates when isActive prop changes
  useEffect(() => {
    if (!editorRef?.current) return;
    const unsubscribe = editorRef.current.onStateChange(updateActiveStates);
    updateActiveStates();
    return () => unsubscribe();
  }, [editorRef, updateActiveStates]);

  return (
    <div className="flex h-9 w-full items-stretch gap-1.5 bg-custom-background-90 overflow-x-scroll">
      {showAccessSpecifier && (
        <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
          {COMMENT_ACCESS_SPECIFIERS.map((access) => {
            const isAccessActive = accessSpecifier === access.key;

            return (
              <Tooltip key={access.key} tooltipContent={access.label}>
                <button
                  type="button"
                  onClick={() => handleAccessChange?.(access.key)}
                  className={cn("grid place-items-center aspect-square rounded-sm p-1 hover:bg-custom-background-80", {
                    "bg-custom-background-80": isAccessActive,
                  })}
                >
                  <access.icon
                    className={cn("h-3.5 w-3.5 text-custom-text-400", {
                      "text-custom-text-100": isAccessActive,
                    })}
                    strokeWidth={2}
                  />
                </button>
              </Tooltip>
            );
          })}
        </div>
      )}
      <div className="flex w-full items-stretch justify-between gap-2 rounded border-[0.5px] border-custom-border-200 p-1">
        <div className="flex items-stretch">
          {Object.keys(toolbarItems).map((key, index) => (
            <div
              key={key}
              className={cn("flex items-stretch gap-0.5 border-r border-custom-border-200 px-2.5", {
                "pl-0": index === 0,
                "pr-0": index === Object.keys(toolbarItems).length - 1,
              })}
            >
              {toolbarItems[key].map((item) => (
                <Tooltip
                  key={item.key}
                  tooltipContent={
                    <p className="flex flex-col gap-1 text-center text-xs">
                      <span className="font-medium">{item.name}</span>
                      {item.shortcut && <kbd className="text-custom-text-400">{item.shortcut.join(" + ")}</kbd>}
                    </p>
                  }
                >
                  <button
                    type="button"
                    onClick={() => executeCommand(item.key)}
                    className={cn(
                      "grid place-items-center aspect-square rounded-sm p-0.5 text-custom-text-400 hover:bg-custom-background-80",
                      {
                        "bg-custom-background-80 text-custom-text-100": activeStates[item.key],
                      }
                    )}
                  >
                    <item.icon
                      className={cn("h-3.5 w-3.5", {
                        "text-custom-text-100": activeStates[item.key],
                      })}
                      strokeWidth={2.5}
                    />
                  </button>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
        {showSubmitButton && (
          <div className="sticky right-1">
            <Button
              type="submit"
              variant="primary"
              className="px-2.5 py-1.5 text-xs"
              onClick={handleSubmit}
              disabled={isCommentEmpty}
              loading={isSubmitting}
            >
              Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
