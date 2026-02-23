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
import { ToastStatic, TOAST_TYPE } from "./toast";

const meta = preview.meta({
  component: ToastStatic,
  parameters: {
    layout: "centered",
  },
});

export const Success = meta.story({
  args: {
    type: TOAST_TYPE.SUCCESS,
    title: "Changes saved",
    message: "Your changes have been saved successfully.",
  },
});

export const Error = meta.story({
  args: {
    type: TOAST_TYPE.ERROR,
    title: "Upload failed",
    message: "Failed to upload file. Try again.",
  },
});

export const Warning = meta.story({
  args: {
    type: TOAST_TYPE.WARNING,
    title: "Unsaved changes",
    message: "You have unsaved changes. Save before leaving.",
  },
});

export const Info = meta.story({
  args: {
    type: TOAST_TYPE.INFO,
    title: "New feature available",
    message: "Check out our latest feature in settings.",
  },
});

export const Loading = meta.story({
  args: {
    type: TOAST_TYPE.LOADING,
    title: "Processing your request...",
  },
});

export const WithActions = meta.story({
  args: {
    type: TOAST_TYPE.SUCCESS,
    title: "File uploaded",
    message: "Your file has been uploaded successfully.",
    actionItems: (
      <>
        <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
        <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
      </>
    ),
  },
});

export const ErrorWithActions = meta.story({
  args: {
    type: TOAST_TYPE.ERROR,
    title: "Action Required",
    message: "Please review the error details.",
    actionItems: <button className="text-13 font-medium text-primary hover:text-secondary">Retry</button>,
  },
});

export const WarningWithActions = meta.story({
  args: {
    type: TOAST_TYPE.WARNING,
    title: "Warning",
    message: "Unsaved changes will be lost.",
    actionItems: <button className="text-13 font-medium text-primary hover:text-secondary">Save now</button>,
  },
});

export const InfoWithActions = meta.story({
  args: {
    type: TOAST_TYPE.INFO,
    title: "Tip",
    message: "You can customize keyboard shortcuts.",
    actionItems: <button className="text-13 font-medium text-primary hover:text-secondary">Learn more</button>,
  },
});

export const LoadingDefaultTitle = meta.story({
  args: {
    type: TOAST_TYPE.LOADING,
    title: "",
  },
});

export const LoadingToastType = meta.story({
  args: {
    type: TOAST_TYPE.LOADING_TOAST,
    title: "Loading toast type",
  },
});

export const TitleOnly = meta.story({
  args: {
    type: TOAST_TYPE.SUCCESS,
    title: "No message",
  },
});

export const DarkTheme = meta.story({
  args: {
    type: TOAST_TYPE.INFO,
    title: "Dark info",
    message: "Dark theme",
    theme: "dark",
  },
});
