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
import type { SuggestionProps } from "@tiptap/suggestion";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
// helpers
import { DROPDOWN_NAVIGATION_KEYS, getNextValidIndex } from "@/helpers/tippy";
// types
import type { ISlashCommandItem } from "@/types";
// components
import type { TSlashCommandSection } from "./command-items-list";
import { CommandMenuItem } from "./command-menu-item";

export type SlashCommandsMenuProps = SuggestionProps<TSlashCommandSection, ISlashCommandItem> & {
  onClose: () => void;
  registerOnKeyDownHandler?: (handler: ((event: KeyboardEvent) => boolean) | null) => void;
};

export const SlashCommandsMenu = forwardRef(function SlashCommandsMenu(props: SlashCommandsMenuProps, ref) {
  const { items: sections, command, query, onClose, registerOnKeyDownHandler } = props;
  // states
  const [selectedIndex, setSelectedIndex] = useState({
    section: 0,
    item: 0,
  });
  // refs
  const commandListContainer = useRef<HTMLDivElement>(null);

  const selectItem = useCallback(
    (sectionIndex: number, itemIndex: number) => {
      const item = sections[sectionIndex]?.items?.[itemIndex];
      if (item) command(item);
    },
    [command, sections]
  );
  const hasResults = sections.some((s) => s.items?.length > 0);
  const selectedIndexForRender = useMemo(() => {
    if (!hasResults) return selectedIndex;

    const section = sections[selectedIndex.section];
    if (section?.items?.[selectedIndex.item]) return selectedIndex;

    return {
      section: 0,
      item: 0,
    };
  }, [hasResults, sections, selectedIndex]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (![...DROPDOWN_NAVIGATION_KEYS, "Tab"].includes(event.key)) return false;
      if (!hasResults) return false;

      if (event.key === "Enter" || event.key === "Tab") {
        selectItem(selectedIndexForRender.section, selectedIndexForRender.item);
        return true;
      }

      const newIndex = getNextValidIndex({
        event,
        sections,
        selectedIndex: selectedIndexForRender,
      });

      if (newIndex) {
        setSelectedIndex(newIndex);
      }

      return true;
    },
    [hasResults, sections, selectItem, selectedIndexForRender]
  );

  // scroll to the dropdown item when navigating via keyboard
  useLayoutEffect(() => {
    const container = commandListContainer?.current;
    if (!container) return;

    const item = container.querySelector(
      `#item-${selectedIndexForRender.section}-${selectedIndexForRender.item}`
    ) as HTMLElement;

    // use scroll into view to bring the item in view if it is not in view
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndexForRender]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => handleKeyDown(event),
  }));

  useEffect(() => {
    registerOnKeyDownHandler?.(handleKeyDown);

    return () => {
      registerOnKeyDownHandler?.(null);
    };
  }, [handleKeyDown, registerOnKeyDownHandler]);

  useOutsideClickDetector(commandListContainer, onClose);

  if (!hasResults) return null;

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
        id="slash-command"
        ref={commandListContainer}
        className="relative max-h-80 min-w-[12rem] overflow-y-auto rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 shadow-raised-200 space-y-2"
        style={{
          zIndex: 100,
        }}
      >
        {sections.map((section, sectionIndex) => (
          <div key={section.key} className="space-y-2">
            {section.title && <h6 className="text-11 font-semibold text-tertiary">{section.title}</h6>}
            <div>
              {section.items?.map((item, itemIndex) => (
                <CommandMenuItem
                  key={item.key}
                  isSelected={
                    sectionIndex === selectedIndexForRender.section && itemIndex === selectedIndexForRender.item
                  }
                  item={item}
                  itemIndex={itemIndex}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectItem(sectionIndex, itemIndex);
                  }}
                  onMouseEnter={() =>
                    setSelectedIndex({
                      section: sectionIndex,
                      item: itemIndex,
                    })
                  }
                  sectionIndex={sectionIndex}
                  query={query}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
});

SlashCommandsMenu.displayName = "SlashCommandsMenu";
