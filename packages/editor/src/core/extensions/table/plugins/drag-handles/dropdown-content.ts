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

import type { Editor } from "@tiptap/core";
// constants
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";
// icons
import { DRAG_HANDLE_ICONS, createSvgElement } from "./icons";

export type DropdownOption = {
  key: string;
  label: string;
  icon: string;
  showRightIcon: boolean;
};

/**
 * Creates the color selector section for the dropdown
 */
export function createColorSelector(): HTMLElement {
  const container = document.createElement("div");
  container.className = "mb-2";

  // Create toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className =
    "flex items-center justify-between gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-transparent-hover";
  toggleBtn.setAttribute("data-action", "toggle-color-selector");

  // Left span with icon and text
  const leftSpan = document.createElement("span");
  leftSpan.className = "flex items-center gap-2";
  const paletteIcon = createSvgElement(DRAG_HANDLE_ICONS.palette, "shrink-0 size-3");
  leftSpan.appendChild(paletteIcon);
  leftSpan.appendChild(document.createTextNode("Color"));

  // Right chevron icon
  const chevronIcon = createSvgElement(
    DRAG_HANDLE_ICONS.chevronRight,
    "shrink-0 size-3 transition-transform duration-200 color-chevron"
  );

  toggleBtn.appendChild(leftSpan);
  toggleBtn.appendChild(chevronIcon);
  container.appendChild(toggleBtn);

  // Create color panel
  const colorPanel = document.createElement("div");
  colorPanel.className = "p-1 space-y-2 mb-1.5 hidden color-panel";

  const innerDiv = document.createElement("div");
  innerDiv.className = "space-y-1";

  const title = document.createElement("p");
  title.className = "text-11 text-tertiary font-semibold";
  title.textContent = "Background colors";
  innerDiv.appendChild(title);

  const colorsContainer = document.createElement("div");
  colorsContainer.className = "flex items-center flex-wrap gap-2";

  // Create color buttons
  COLORS_LIST.forEach((color) => {
    const colorBtn = document.createElement("button");
    colorBtn.type = "button";
    colorBtn.className =
      "flex-shrink-0 size-6 rounded-sm border-[0.5px] border-strong-1 hover:opacity-60 transition-opacity";
    colorBtn.style.backgroundColor = color.backgroundColor;
    colorBtn.setAttribute("data-action", "set-bg-color");
    colorBtn.setAttribute("data-color", color.backgroundColor);
    colorsContainer.appendChild(colorBtn);
  });

  // Create clear color button
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className =
    "flex-shrink-0 size-6 grid place-items-center rounded-sm text-tertiary border-[0.5px] border-strong-1 hover:bg-layer-transparent-hover transition-colors";
  clearBtn.setAttribute("data-action", "clear-bg-color");
  const banIcon = createSvgElement(DRAG_HANDLE_ICONS.ban, "size-4");
  clearBtn.appendChild(banIcon);
  colorsContainer.appendChild(clearBtn);

  innerDiv.appendChild(colorsContainer);
  colorPanel.appendChild(innerDiv);
  container.appendChild(colorPanel);

  return container;
}

/**
 * Creates the dropdown content with options and color selector
 */
export function createDropdownContent(options: DropdownOption[]): DocumentFragment {
  const fragment = document.createDocumentFragment();

  // Create option buttons
  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `flex items-center ${option.showRightIcon ? "justify-between" : ""} gap-2 w-full rounded-sm px-1 py-1.5 text-11 text-left truncate text-secondary hover:bg-layer-transparent-hover`;
    btn.setAttribute("data-action", option.key);

    // Create icon element
    const iconElement = createSvgElement(option.icon, "shrink-0 size-3");

    // Create label
    const labelDiv = document.createElement("div");
    labelDiv.className = "flex-grow truncate";
    labelDiv.textContent = option.label;

    // Append in correct order
    if (option.showRightIcon) {
      btn.appendChild(labelDiv);
      btn.appendChild(iconElement);
    } else {
      btn.appendChild(iconElement);
      btn.appendChild(labelDiv);
    }

    fragment.appendChild(btn);

    // Add divider after first option (header toggle)
    if (index === 0) {
      const hr = document.createElement("hr");
      hr.className = "my-2 border-subtle";
      fragment.appendChild(hr);

      // Add color selector after divider
      const colorSection = createColorSelector();
      fragment.appendChild(colorSection);
    }
  });

  return fragment;
}

/**
 * Handles dropdown action events
 */
export function handleDropdownAction(
  action: string,
  editor: Editor,
  onClose: () => void,
  colorPanel?: Element | null,
  colorChevron?: Element | null
): void {
  switch (action) {
    case "toggle-color-selector":
      if (colorPanel && colorChevron) {
        const isHidden = colorPanel.classList.contains("hidden");
        if (isHidden) {
          colorPanel.classList.remove("hidden");
          colorChevron.classList.add("rotate-90");
        } else {
          colorPanel.classList.add("hidden");
          colorChevron.classList.remove("rotate-90");
        }
      }
      break;
    case "set-bg-color": {
      // Color is handled by the button's data-color attribute
      // This case is handled in the event listener
      break;
    }
    case "clear-bg-color":
      editor
        .chain()
        .focus()
        .updateAttributes(CORE_EXTENSIONS.TABLE_CELL, {
          background: null,
        })
        .run();
      onClose();
      break;
    default:
      // Other actions are handled by specific implementations
      break;
  }
}
