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
import { screen } from "storybook/test";
import { ModalPortal } from "./";
import { EPortalPosition, EPortalWidth } from "./constants";

const meta = preview.meta({
  title: "Overlays/Modal Portal",
  component: ModalPortal,
  parameters: {
    layout: "centered",
  },
  args: {
    isOpen: false,
    children: (
      <div className="p-6 bg-white">
        <h2 className="text-18 font-semibold">Modal Content</h2>
      </div>
    ),
  },
});

export const Default = meta.story({
  args: { isOpen: true },
});

export const LeftPosition = meta.story({
  args: { isOpen: true, position: EPortalPosition.LEFT },
});

export const CenterPosition = meta.story({
  args: { isOpen: true, position: EPortalPosition.CENTER },
});

export const QuarterWidth = meta.story({
  args: { isOpen: true, width: EPortalWidth.QUARTER },
});

export const ThreeQuarterWidth = meta.story({
  args: { isOpen: true, width: EPortalWidth.THREE_QUARTER },
});

export const FullWidth = meta.story({
  args: { isOpen: true, width: EPortalWidth.FULL },
});

export const FullScreen = meta.story({
  args: { isOpen: true, fullScreen: true },
});

export const NoOverlay = meta.story({
  args: { isOpen: true, showOverlay: false },
});

export const NoCloseOnOverlay = meta.story({
  args: { isOpen: true, closeOnOverlayClick: false },
});

export const NoCloseOnEscape = meta.story({
  args: { isOpen: true, closeOnEscape: false },
});

export const CustomStyling = meta.story({
  args: {
    isOpen: true,
    className: "custom-modal-container",
    overlayClassName: "bg-blue-500/30",
    contentClassName: "border-l-4 border-blue-500",
  },
});

export const Closed = meta.story({
  args: { isOpen: false },
});

export const CloseViaOverlayClick = meta.story({
  args: { isOpen: true },
  async play({ userEvent }) {
    const dialog = await screen.findByRole("dialog");
    const overlay = dialog.querySelector("[aria-hidden='true']");
    if (overlay) {
      await userEvent.click(overlay);
    }
  },
});

export const CloseViaEscapeKey = meta.story({
  args: { isOpen: true },
  async play({ userEvent }) {
    await screen.findByText("Modal Content");
    await userEvent.keyboard("{Escape}");
  },
});
