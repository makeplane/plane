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

import preview from "#.storybook/preview";
import { ChevronRightIcon } from "../icons/arrows/chevron-right";
import { CollapsibleButton } from "./collapsible-button";

const meta = preview.meta({
  component: CollapsibleButton,
  parameters: {
    layout: "centered",
  },
  args: {
    className: "w-96",
    isOpen: true,
    title: "Section Title",
  },
});

export const Open = meta.story({
  args: {
    title: "Open Section",
    indicatorElement: <span className="text-11 text-tertiary">3 items</span>,
    actionItemElement: <button className="text-11 text-accent-primary hover:underline">Add item</button>,
  },
});

export const Closed = meta.story({
  args: {
    isOpen: false,
    title: "Closed Section",
    indicatorElement: <span className="text-11 text-tertiary">5 items</span>,
    actionItemElement: <button className="text-11 text-accent-primary hover:underline">Add item</button>,
  },
});

export const HiddenChevron = meta.story({
  args: {
    title: "No Chevron",
    hideChevron: true,
  },
});

export const CustomChevron = meta.story({
  args: {
    title: "Custom Chevron Icon",
    ChevronIcon: ChevronRightIcon,
  },
});
