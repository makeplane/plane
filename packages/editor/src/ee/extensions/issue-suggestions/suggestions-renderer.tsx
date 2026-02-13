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

import { FloatingOverlay } from "@floating-ui/react";
import { ReactRenderer } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash-es";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { cn, CORE_EXTENSIONS } from "@plane/utils";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { CommandListInstance } from "@/helpers/tippy";
import { DROPDOWN_NAVIGATION_KEYS } from "@/helpers/tippy";
// types
import type { TEmbedItem } from "@/types";

export type WorkItemSuggestionsDropdownProps = SuggestionProps & {
  searchCallback: (searchQuery: string) => Promise<TEmbedItem[]>;
  onClose: () => void;
};

const WorkItemSuggestionsDropdown = forwardRef(function WorkItemSuggestionsDropdown(
  props: WorkItemSuggestionsDropdownProps,
  ref
) {
  const { editor, searchCallback, query, range, onClose } = props;
  // states
  const [items, setItems] = useState<TEmbedItem[] | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // refs
  const dropdownContainer = useRef<HTMLDivElement>(null);
  const searchCallbackRef = useRef(searchCallback);
  const debouncedSearchRef = useRef<ReturnType<typeof debounce> | null>(null);

  const selectItem = useCallback(
    (item: TEmbedItem) => {
      try {
        const docSize = editor.state.doc.content.size;
        if (range.from < 0 || range.to >= docSize) return;

        const transactionId = uuidv4();
        editor
          .chain()
          .deleteRange(range)
          .insertContentAt(range.from, {
            type: "issue-embed-component",
            attrs: {
              entity_identifier: item?.id,
              project_identifier: item?.projectId,
              workspace_identifier: item?.workspaceSlug,
              id: transactionId,
              entity_name: "issue",
            },
          })
          .run();

        // new document state and calculate the new position
        const newDoc = editor.state.doc;
        const newPositionToInsertEmptyParaAt = range.from + (newDoc?.nodeAt(range.from)?.nodeSize ?? 0);

        // insert an empty paragraph at the position after the issue embed
        editor
          .chain()
          .insertContentAt(newPositionToInsertEmptyParaAt, { type: "paragraph" })
          .setTextSelection(newPositionToInsertEmptyParaAt + 1)
          .run();
      } catch (error) {
        console.log("Error inserting issue embed", error);
      }
    },
    [editor, range]
  );

  // keydown events handler
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (!items) return;
      if (!DROPDOWN_NAVIGATION_KEYS.includes(event.key)) return false;
      event.preventDefault();

      if (event.key === "ArrowUp") {
        const newIndex = selectedIndex - 1;
        setSelectedIndex(newIndex < 0 ? items.length - 1 : newIndex);
        return true;
      }

      if (event.key === "ArrowDown") {
        const newIndex = selectedIndex + 1;
        setSelectedIndex(newIndex >= items.length ? 0 : newIndex);
        return true;
      }

      if (event.key === "Enter") {
        const item = items[selectedIndex];
        selectItem(item);
        return true;
      }

      return true;
    },
  }));

  useEffect(() => {
    searchCallbackRef.current = searchCallback;
  }, [searchCallback]);

  useEffect(() => {
    debouncedSearchRef.current = debounce(async (searchQuery: string) => {
      setItems(undefined);
      try {
        const data = await searchCallbackRef.current(searchQuery);
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setItems([]);
      }
    }, 300);

    return () => {
      debouncedSearchRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (query !== undefined && query !== null) {
      void debouncedSearchRef.current?.(query);
    }
  }, [query]);

  useOutsideClickDetector(dropdownContainer, onClose);

  return (
    <>
      {/* Backdrop */}
      <FloatingOverlay
        style={{
          zIndex: 99,
        }}
        lockScroll
      />
      <div
        ref={dropdownContainer}
        id="issue-list-container"
        className="relative max-h-80 w-96 overflow-y-auto rounded-md border-[0.5px] border-subtle-1 bg-layer-1 px-2 py-2.5 shadow-raised-200 space-y-2"
        style={{
          zIndex: 100,
        }}
      >
        {items ? (
          items.length > 0 ? (
            items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "w-full flex items-center gap-2 select-none truncate rounded-sm px-1 py-1.5 text-left text-11 text-secondary hover:bg-layer-1-hover",
                  {
                    "bg-layer-1-hover": index === selectedIndex,
                  }
                )}
                onClick={() => selectItem(item)}
              >
                <h5 className="whitespace-nowrap text-11 text-tertiary flex-shrink-0">{item.subTitle}</h5>
                {item.icon}
                <p className="flex-grow w-full truncate text-11">{item.title}</p>
              </button>
            ))
          ) : (
            <div className="text-center text-11 text-placeholder">No results found</div>
          )
        ) : (
          <div className="text-center text-11 text-placeholder">Loading</div>
        )}
      </div>
    </>
  );
});

export function WorkItemSuggestionsDropdownRenderer(
  searchCallback: (searchQuery: string) => Promise<TEmbedItem[]>
): SuggestionOptions["render"] {
  return () => {
    let component: ReactRenderer<CommandListInstance, WorkItemSuggestionsDropdownProps> | null = null;
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      cleanup();
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.WORK_ITEM_EMBED);
    };

    return {
      onStart: (props) => {
        editorRef = props.editor;
        if (!searchCallback || !props.clientRect) return;
        component = new ReactRenderer<CommandListInstance, WorkItemSuggestionsDropdownProps>(
          WorkItemSuggestionsDropdown,
          {
            props: {
              ...props,
              searchCallback,
              onClose: () => handleClose(props.editor),
            } satisfies WorkItemSuggestionsDropdownProps,
            editor: props.editor,
            className: "fixed z-[100]",
          }
        );
        if (!component.element) return;
        const element = component.element as HTMLElement;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.WORK_ITEM_EMBED);
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },
      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        const element = component.element as HTMLElement;
        cleanup();
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },
      onKeyDown: ({ event }) => {
        if (event.key === "Escape") {
          handleClose();
          return true;
        }

        if (DROPDOWN_NAVIGATION_KEYS.includes(event.key)) {
          event?.stopPropagation();
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },
      onExit: ({ editor }) => {
        component?.element?.remove();
        handleClose(editor);
      },
    };
  };
}
