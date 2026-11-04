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
// propel imports
import {
  SuggestionMenu,
  SuggestionMenuGroup,
  SuggestionMenuItem,
  SuggestionMenuItemIcon,
  SuggestionMenuItemTitle,
  SuggestionMenuLabel,
} from "@makeplane/propel/elements/suggestion-menu";
// plane utils
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { DROPDOWN_NAVIGATION_KEYS, getNextValidIndex } from "@/helpers/tippy";
// types
import type { TMentionHandler, TMentionSection, TMentionSuggestion } from "@/types";

export type MentionsListDropdownProps = SuggestionProps<TMentionSection, TMentionSuggestion> &
  Pick<TMentionHandler, "searchCallback"> & {
    onClose: () => void;
  };

export const MentionsListDropdown = forwardRef(function MentionsListDropdown(props: MentionsListDropdownProps, ref) {
  const { command, query, searchCallback, onClose } = props;
  // states
  const [sections, setSections] = useState<TMentionSection[]>([]);
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
          command({
            ...item,
            id: transactionId,
          });
        }
      } catch (error) {
        console.error("Error selecting mention item:", error);
      }
    },
    [command, sections]
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
          setSections(sectionsResponse);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [searchCallback]
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

    const item = container.querySelector(`#mention-item-${selectedIndex.section}-${selectedIndex.item}`) as HTMLElement;
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
      <SuggestionMenu
        width="fit"
        render={
          <div
            ref={dropdownContainer}
            className="relative"
            style={{ zIndex: 100 }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          />
        }
      >
        {isLoading ? (
          <div className="p-2 text-center text-body-sm-regular text-placeholder">Loading...</div>
        ) : sections.length ? (
          sections.map((section, sectionIndex) => (
            <SuggestionMenuGroup key={section.key}>
              {section.title && <SuggestionMenuLabel>{section.title}</SuggestionMenuLabel>}
              {section.items.map((item, itemIndex) => {
                const isSelected = sectionIndex === selectedIndex.section && itemIndex === selectedIndex.item;

                return (
                  <SuggestionMenuItem
                    key={item.id}
                    data-highlighted={isSelected ? "" : undefined}
                    render={
                      <button
                        id={`mention-item-${sectionIndex}-${itemIndex}`}
                        type="button"
                        className="focus-visible:ring-2 focus-visible:ring-accent-strong focus-visible:ring-inset"
                        style={{ textAlign: "start" }}
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
                      />
                    }
                  >
                    <SuggestionMenuItemIcon>{item.icon}</SuggestionMenuItemIcon>
                    <SuggestionMenuItemTitle>
                      <span className="flex items-center gap-1.5">
                        {item.subTitle && (
                          <span className="shrink-0 text-caption-md-regular whitespace-nowrap text-tertiary">
                            {item.subTitle}
                          </span>
                        )}
                        <span className="truncate">{item.title}</span>
                      </span>
                    </SuggestionMenuItemTitle>
                  </SuggestionMenuItem>
                );
              })}
            </SuggestionMenuGroup>
          ))
        ) : (
          <div className="p-2 text-center text-body-sm-regular text-placeholder">No results</div>
        )}
      </SuggestionMenu>
    </>
  );
});

MentionsListDropdown.displayName = "MentionsListDropdown";
