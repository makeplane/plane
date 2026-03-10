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

import { CircularBarSpinner } from "./circular-bar-spinner";

const meta = preview.meta({
  title: "Feedback/Circular Bar Spinner",
  component: CircularBarSpinner,
  parameters: {
    layout: "centered",
  },
  args: {
    height: "16px",
    width: "16px",
  },
});

export const Default = meta.story({});

export const Small = meta.story({
  args: {
    height: "12px",
    width: "12px",
  },
});

export const Medium = meta.story({
  args: {
    height: "24px",
    width: "24px",
  },
});

export const Large = meta.story({
  args: {
    height: "32px",
    width: "32px",
  },
});

export const ExtraLarge = meta.story({
  args: {
    height: "48px",
    width: "48px",
  },
});

export const CustomColor = meta.story({
  args: {
    className: "text-success-primary",
  },
});

export const InButton = meta.story({
  render(_args) {
    return (
      <button className="flex items-center gap-2 rounded-sm bg-green-500 px-4 py-2 text-on-color">
        <CircularBarSpinner height="16px" width="16px" />
        <span>Processing...</span>
      </button>
    );
  },
});

export const CenteredInCard = meta.story({
  render(_args) {
    return (
      <div className="w-96 rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CircularBarSpinner height="48px" width="48px" />
          <p className="text-13 text-gray-600">Processing data...</p>
        </div>
      </div>
    );
  },
});
