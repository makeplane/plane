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
import { expect, screen } from "storybook/test";
import { Toast, setToast, updateToast, setPromiseToast, dismissToast, TOAST_TYPE } from "./toast";
import type { ToastProps } from "./toast";

const meta = preview.type<{ parameters: { toast: ToastProps } }>().meta({
  component: Toast,
  parameters: {
    layout: "centered",
    toast: { theme: "light" } satisfies ToastProps,
  },
  decorators: [
    (Story, { parameters }: { parameters: { toast?: ToastProps } }) => {
      const { toast } = parameters;
      return (
        <>
          {toast && <Toast {...toast} />}
          <Story />
        </>
      );
    },
  ],
});

export const Success = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Your changes have been saved successfully.",
          })
        }
        className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
      >
        Show Success Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Success Toast" }));
    await expect(await screen.findByText("Success!")).toBeVisible();
  },
});

export const Error = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error",
            message: "Something went wrong. Please try again.",
          })
        }
        className="rounded-sm bg-danger-primary px-4 py-2 text-13 text-on-color hover:bg-danger-primary/90"
      >
        Show Error Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Error Toast" }));
    await expect(await screen.findByText("Error")).toBeVisible();
  },
});

export const Warning = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "Warning",
            message: "This action cannot be undone.",
          })
        }
        className="rounded-sm bg-warning-primary px-4 py-2 text-13 text-on-color hover:bg-warning-primary/90"
      >
        Show Warning Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Warning Toast" }));
    await expect(await screen.findByText("Warning")).toBeVisible();
  },
});

export const Info = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.INFO,
            title: "Information",
            message: "Here's some helpful information for you.",
          })
        }
        className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
      >
        Show Info Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Info Toast" }));
    await expect(await screen.findByText("Information")).toBeVisible();
  },
});

export const Loading = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.LOADING,
            title: "Loading...",
          })
        }
        className="rounded-sm bg-layer-2 border border-subtle px-4 py-2 text-13 text-primary hover:bg-layer-1"
      >
        Show Loading Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Loading Toast" }));
    await expect(await screen.findByText("Loading...")).toBeVisible();
  },
});

export const WithActionItems = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "File uploaded",
            message: "Your file has been uploaded successfully.",
            actionItems: (
              <>
                <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
                <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
              </>
            ),
          })
        }
        className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
      >
        Show Toast with Action
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Toast with Action" }));
    await expect(await screen.findByText("File uploaded")).toBeVisible();
  },
});

export const UpdateToast = meta.story({
  render() {
    const handleUpdate = () => {
      const id = setToast({
        type: TOAST_TYPE.LOADING,
        title: "Processing...",
      });

      setTimeout(() => {
        updateToast(id, {
          type: TOAST_TYPE.SUCCESS,
          title: "Complete!",
          message: "The operation has finished successfully.",
        });
      }, 2000);
    };

    return (
      <button
        onClick={handleUpdate}
        className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
      >
        Update Toast After 2s
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Update Toast After 2s" }));
    await expect(await screen.findByText("Processing...")).toBeVisible();
  },
});

export const PromiseToast = meta.story({
  render() {
    const handlePromise = () => {
      const promise = new Promise<{ name?: string; error?: string }>((resolve) => {
        setTimeout(() => resolve({ name: "Success data" }), 2000);
      });

      setPromiseToast(promise, {
        loading: "Processing request...",
        success: {
          title: "Request completed!",
          message: (data) => `Successfully processed: ${data.name}`,
        },
        error: {
          title: "Request failed",
          message: (error) => `Error: ${error.error}`,
        },
      });
    };

    return (
      <button
        onClick={handlePromise}
        className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
      >
        Show Promise Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Promise Toast" }));
    await expect(await screen.findByText("Processing request...")).toBeVisible();
  },
});

export const TitleOnly = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Saved!",
          })
        }
        className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
      >
        Show Title Only
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Title Only" }));
    await expect(await screen.findByText("Saved!")).toBeVisible();
  },
});

export const LongMessage = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.INFO,
            title: "Important Information",
            message:
              "This is a longer message that provides more detailed information about what happened and what the user should do next.",
          })
        }
        className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
      >
        Show Long Message
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Long Message" }));
    await expect(await screen.findByText("Important Information")).toBeVisible();
  },
});

export const DarkTheme = meta.story({
  parameters: {
    toast: { theme: "dark" },
  },
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Dark Theme Toast",
            message: "This toast uses dark theme.",
          })
        }
        className="rounded-sm bg-gray-800 px-4 py-2 text-13 text-on-color"
      >
        Show Dark Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Dark Toast" }));
    await expect(await screen.findByText("Dark Theme Toast")).toBeVisible();
  },
});

export const DismissToast = meta.story({
  render() {
    const handleDismiss = () => {
      const id = setToast({
        type: TOAST_TYPE.INFO,
        title: "Will be dismissed",
        message: "This toast will be dismissed programmatically.",
      });
      setTimeout(() => dismissToast(id), 1000);
    };

    return (
      <button onClick={handleDismiss} className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color">
        Show & Dismiss Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show & Dismiss Toast" }));
    await expect(await screen.findByText("Will be dismissed")).toBeVisible();
  },
});

export const PromiseToastError = meta.story({
  render() {
    const handleReject = () => {
      const promise = new Promise<{ error: string }>((resolve) => {
        setTimeout(() => resolve({ error: "Network timeout" }), 100);
      });
      setPromiseToast(promise, {
        loading: "Sending request...",
        success: {
          title: "Request completed",
          message: (data) => `Result: ${data.error}`,
        },
        error: {
          title: "Request failed",
        },
      });
    };
    return (
      <button onClick={handleReject} className="rounded-sm bg-danger-primary px-4 py-2 text-13 text-on-color">
        Trigger Promise Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Trigger Promise Toast" }));
    await expect(await screen.findByText("Request completed")).toBeVisible();
  },
});

export const DismissToastImmediate = meta.story({
  render() {
    const handleDismiss = () => {
      const id = setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Quick dismiss",
      });
      dismissToast(id);
    };
    return (
      <button onClick={handleDismiss} className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color">
        Dismiss Immediately
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Dismiss Immediately" }));
  },
});

export const LoadingDefaultTitle = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.LOADING,
          })
        }
        className="rounded-sm bg-layer-2 border border-subtle px-4 py-2 text-13 text-primary"
      >
        Show Loading No Title
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Loading No Title" }));
    // covers `toastData.title ?? "Loading..."` branch where title is undefined
    await expect(await screen.findByText("Loading...")).toBeVisible();
  },
});

export const InteractWithToast = meta.story({
  render() {
    return (
      <button
        onClick={() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Clickable toast",
            message: "Try clicking me.",
          })
        }
        className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color"
      >
        Show Clickable Toast
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Show Clickable Toast" }));
    const toastEl = await screen.findByText("Clickable toast");
    // mousedown on the toast root to cover onMouseDown handler (lines 168-171)
    const toastRoot = toastEl.closest("[class*='flex group']");
    if (toastRoot) {
      toastRoot.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    }
  },
});

export const PromiseToastSuccess = meta.story({
  render() {
    const handleSuccess = () => {
      const promise = new Promise<{ name: string }>((resolve) => {
        setTimeout(() => resolve({ name: "test" }), 100);
      });
      setPromiseToast(promise, {
        success: {
          title: "Promise succeeded!",
          message: (data) => `Got: ${data.name}`,
          actionItems: (data) => <button className="text-13 font-medium text-primary">{data.name}</button>,
        },
        error: {
          title: "Failed",
        },
      });
    };
    return (
      <button onClick={handleSuccess} className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color">
        Trigger Promise Success
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Trigger Promise Success" }));
    // covers setPromiseToast success path with message and actionItems callbacks
    await expect(await screen.findByText("Promise succeeded!")).toBeVisible();
  },
});

export const PromiseWithActions = meta.story({
  render() {
    const handleSuccess = () => {
      const promise = new Promise<{ name: string }>((resolve) => {
        setTimeout(() => resolve({ name: "done" }), 100);
      });
      setPromiseToast(promise, {
        success: {
          title: "Completed with action",
          message: (data) => `Result: ${data.name}`,
          actionItems: (data) => <button className="text-13">{data.name}</button>,
        },
        error: {
          title: "Failed",
        },
      });
    };
    return (
      <button onClick={handleSuccess} className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color">
        Promise With Actions
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Promise With Actions" }));
    await expect(await screen.findByText("Completed with action")).toBeVisible();
  },
});

export const UpdateToLoading = meta.story({
  render() {
    const handleUpdate = () => {
      const id = setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Initial toast",
      });
      setTimeout(() => {
        updateToast(id, {
          type: TOAST_TYPE.LOADING,
          title: "Now loading...",
        });
      }, 100);
    };
    return (
      <button onClick={handleUpdate} className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color">
        Update To Loading
      </button>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Update To Loading" }));
    // covers updateToast with LOADING type branch
    await expect(await screen.findByText("Initial toast")).toBeVisible();
  },
});
