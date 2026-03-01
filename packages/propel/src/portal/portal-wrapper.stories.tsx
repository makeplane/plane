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
import { PortalWrapper } from "./";

const meta = preview.meta({
  component: PortalWrapper,
  parameters: {
    layout: "centered",
  },
});

export const Default = meta.story({
  render() {
    return (
      <div className="relative">
        <p>This content renders in the normal document flow.</p>
        <PortalWrapper portalId="storybook-portal">
          <div className="fixed top-4 right-4 p-4 bg-blue-500 text-on-color rounded-sm shadow-lg z-50">
            This content is rendered in a portal!
          </div>
        </PortalWrapper>
      </div>
    );
  },
});

export const WithClassName = meta.story({
  render() {
    return (
      <div className="relative">
        <p>Portal with className wrapper.</p>
        <PortalWrapper portalId="storybook-classname-portal" className="custom-portal-wrapper">
          <div className="fixed top-4 left-4 p-4 bg-green-500 text-on-color rounded-sm shadow-lg z-50">
            Portal with className
          </div>
        </PortalWrapper>
      </div>
    );
  },
});

export const WithoutClassName = meta.story({
  render() {
    return (
      <div className="relative">
        <p>Portal without className wrapper.</p>
        <PortalWrapper portalId="storybook-no-classname-portal">
          <div className="fixed top-4 left-4 p-4 bg-yellow-500 text-on-color rounded-sm shadow-lg z-50">
            Portal without className
          </div>
        </PortalWrapper>
      </div>
    );
  },
});

export const WithCallbacks = meta.story({
  args: {
    children: null,
    onMount: fn(),
    onUnmount: fn(),
  },
  render(args) {
    return (
      <PortalWrapper portalId="storybook-callback-portal" onMount={args.onMount} onUnmount={args.onUnmount}>
        <div className="fixed top-4 right-4 p-4 bg-purple-500 text-on-color rounded-sm shadow-lg z-50">
          Portal with callbacks
        </div>
      </PortalWrapper>
    );
  },
});

export const EmptyChildren = meta.story({
  render() {
    return (
      <div>
        <PortalWrapper portalId="storybook-empty-portal">{null}</PortalWrapper>
        <span data-testid="empty-portal-check">Rendered</span>
      </div>
    );
  },
});

export const FallbackDisabled = meta.story({
  render() {
    return (
      <div>
        <PortalWrapper portalId="storybook-fallback-disabled-portal" fallbackToDocument={false}>
          <div>Fallback disabled content</div>
        </PortalWrapper>
        <span data-testid="fallback-disabled-check">Rendered</span>
      </div>
    );
  },
});
