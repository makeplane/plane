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
import { fn } from "storybook/test";
import { CloseIcon } from "../icons/actions/close-icon";
import { Dialog, EDialogWidth } from "./root";

const meta = preview.meta({
  title: "Overlays/Dialog",
  component: Dialog,
  subcomponents: {
    DialogPanel: Dialog.Panel,
    DialogTitle: Dialog.Title,
  },
  args: {
    children: null,
    open: true,
    onOpenChange: fn(),
  },
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel>
          <div className="p-6">
            <Dialog.Title>Dialog Title</Dialog.Title>
            <div className="mt-4">
              <p className="text-13 text-gray-600">This is the dialog content. You can put any content here.</p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300">Cancel</button>
              <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600">
                Confirm
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const TopPosition = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel position="top">
          <div className="p-6">
            <Dialog.Title>Top Positioned Dialog</Dialog.Title>
            <div className="mt-4">
              <p className="text-13 text-gray-600">This dialog appears at the top of the screen instead of centered.</p>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const SmallWidth = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel width={EDialogWidth.SM}>
          <div className="p-6">
            <Dialog.Title>Small Dialog</Dialog.Title>
            <div className="mt-4">
              <p className="text-13 text-gray-600">This is a small dialog.</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600">
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const LargeWidth = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel width={EDialogWidth.XXXXL}>
          <div className="p-6">
            <Dialog.Title>Large Dialog</Dialog.Title>
            <div className="mt-4">
              <p className="text-13 text-gray-600">This is a large dialog with more horizontal space for content.</p>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const WithCloseButton = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel>
          <div className="p-6">
            <div className="flex items-start justify-between">
              <Dialog.Title>Dialog with Close Button</Dialog.Title>
              <button className="rounded-full p-1 hover:bg-gray-100">
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-13 text-gray-600">This dialog has a close button in the header.</p>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const ConfirmationDialog = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel width={EDialogWidth.SM}>
          <div className="p-6">
            <Dialog.Title>Confirm Deletion</Dialog.Title>
            <div className="mt-4">
              <p className="text-13 text-gray-600">
                Are you sure you want to delete this item? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300">Cancel</button>
              <button className="rounded-sm bg-red-500 px-4 py-2 text-13 text-on-color hover:bg-red-600">Delete</button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const FormDialog = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel width={EDialogWidth.MD}>
          <form onSubmit={(e) => e.preventDefault()} className="p-6">
            <Dialog.Title>Create New Item</Dialog.Title>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-13 font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-13 font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
                  placeholder="Enter description"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300">
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </Dialog>
    );
  },
});

export const ScrollableContent = meta.story({
  render(args) {
    return (
      <Dialog {...args}>
        <Dialog.Panel width={EDialogWidth.MD}>
          <div className="p-6">
            <Dialog.Title>Scrollable Content</Dialog.Title>
            <div className="mt-4 max-h-96 overflow-y-auto">
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} className="mb-2 text-13 text-gray-600">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua.
                </p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600">
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    );
  },
});
