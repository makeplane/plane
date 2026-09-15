/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FloatingOverlay } from "@floating-ui/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash-es";
// plane utils
import { useOutsideClickDetector } from "@plane/hooks";
import { cn } from "@plane/utils";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { DROPDOWN_NAVIGATION_KEYS, getNextValidIndex } from "@/helpers/tippy";
// types
import type { TPageEmbedHandler, TPageEmbedSection } from "@/types";
// local types
import type { TPageEmbedComponentAttributes } from "./types";
import { EPageEmbedAttributeNames } from "./types";

export type PageEmbedListDropdownProps = SuggestionProps<TPageEmbedSection, TPageEmbedComponentAttributes> &
  Pick<TPageEmbedHandler, "searchCallback" | "onSelect"> & {
    onClose: () => void;
  };

export const PageEmbedListDropdown = forwardRef(function PageEmbedListDropdown(
  props: PageEmbedListDropdownProps,
  ref
) {
  const { command, editor, query, searchCallback, onSelect, onClose } = props;
  // states
  const [sections, setSections] = useState<TPageEmbedSection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState({
    section: 0,
    item: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  // refs
  const dropdownContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      try {
        const item = sections?.[sectionIndex]?.items?.[itemIndex];
        const transactionId = uuidv4();
        if (item) {
          // only pass the node's declared attributes, extra keys (title, icon) make prosemirror reject the node
          command({
            [EPageEmbedAttributeNames.ID]: transactionId,
            [EPageEmbedAttributeNames.ENTITY_IDENTIFIER]: item.entity_identifier,
            [EPageEmbedAttributeNames.PROJECT_IDENTIFIER]: item.project_identifier ?? null,
            [EPageEmbedAttributeNames.WORKSPACE_IDENTIFIER]: item.workspace_identifier ?? null,
          });
          onSelect?.(item);
        }
      } catch (error) {
        console.error("Error selecting page:", error);
      }
    },
    [command, onSelect, sections]
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (!DROPDOWN_NAVIGATION_KEYS.includes(event.key)) return false;

      if (event.key === "Enter") {
        selectItem(selectedIndex.section, selectedIndex.item);
        return true;
      }

      const newIndex = getNextValidIndex({
        event,
        sections,
        selectedIndex,
      });
      if (newIndex) {
        setSelectedIndex(newIndex);
      }

      return true;
    },
  }));

  // initialize the select index to 0 by default
  useEffect(() => {
    setSelectedIndex({
      section: 0,
      item: 0,
    });
  }, [sections]);

  // debounced search callback
  const debouncedSearchCallback = useCallback(
    debounce(async (searchQuery: string) => {
      try {
        const sectionsResponse = await searchCallback?.(searchQuery);
        if (sectionsResponse) {
          // hide pages that are already embedded in this document
          const embeddedPageIds = new Set<string>();
          editor.state.doc.descendants((node) => {
            const pageId = node.attrs?.[EPageEmbedAttributeNames.ENTITY_IDENTIFIER];
            if (node.type.name === CORE_EXTENSIONS.PAGE_EMBED && pageId) embeddedPageIds.add(pageId);
          });
          setSections(
            sectionsResponse
              .map((section) => ({
                ...section,
                items: section.items.filter((item) => !embeddedPageIds.has(item.entity_identifier)),
              }))
              .filter((section) => section.items.length > 0)
          );
        }
      } catch (error) {
        console.error("Failed to fetch page suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [searchCallback, editor]
  );

  // trigger debounced search when query changes
  useEffect(() => {
    if (query !== undefined && query !== null) {
      setIsLoading(true);
      void debouncedSearchCallback(query);
    }
  }, [query, debouncedSearchCallback]);

  // cancel pending debounced calls on unmount
  useEffect(
    () => () => {
      debouncedSearchCallback.cancel();
    },
    [debouncedSearchCallback]
  );

  // scroll to the dropdown item when navigating via keyboard
  useLayoutEffect(() => {
    const container = dropdownContainer?.current;
    if (!container) return;

    const item = container.querySelector(
      `#page-embed-item-${selectedIndex.section}-${selectedIndex.item}`
    ) as HTMLElement;
    if (item) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      const isItemInView = itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

      if (!isItemInView) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

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
        className="relative max-h-80 w-[16rem] space-y-2 overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200"
        style={{
          zIndex: 100,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {isLoading ? (
          <div className="text-center text-13 text-placeholder">Loading...</div>
        ) : sections.length ? (
          sections.map((section, sectionIndex) => (
            <div key={section.key} className="space-y-2">
              {section.title && <h6 className="text-11 font-semibold text-tertiary">{section.title}</h6>}
              {section.items.map((item, itemIndex) => {
                const isSelected = sectionIndex === selectedIndex.section && itemIndex === selectedIndex.item;

                return (
                  <button
                    key={item.id}
                    id={`page-embed-item-${sectionIndex}-${itemIndex}`}
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 truncate rounded-sm px-1 py-1.5 text-left text-11 text-secondary hover:bg-layer-1-hover",
                      {
                        "bg-layer-1-hover": isSelected,
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectItem(sectionIndex, itemIndex);
                    }}
                    onMouseEnter={() =>
                      setSelectedIndex({
                        section: sectionIndex,
                        item: itemIndex,
                      })
                    }
                  >
                    <span className="grid size-5 flex-shrink-0 place-items-center">{item.icon}</span>
                    <p className="flex-grow truncate">{item.title}</p>
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="text-center text-13 text-placeholder">No pages found</div>
        )}
      </div>
    </>
  );
});

PageEmbedListDropdown.displayName = "PageEmbedListDropdown";
