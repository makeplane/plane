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

import { Skeleton } from "./index";

const meta = preview.meta({
  title: "Feedback/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
  args: {
    children: null,
  },
});

export const Default = meta.story({
  args: {
    className: "w-80 flex flex-col gap-2",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="40px" width="100%" />
      </Skeleton>
    );
  },
});

export const Card = meta.story({
  args: {
    className: "w-80 flex flex-col gap-4",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="200px" width="100%" />
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="20px" width="60%" />
          <Skeleton.Item height="16px" width="40%" />
        </div>
      </Skeleton>
    );
  },
});

export const List = meta.story({
  args: {
    className: "w-96 flex flex-col gap-3",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton.Item height="40px" width="40px" className="rounded-full" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton.Item height="16px" width="70%" />
              <Skeleton.Item height="12px" width="50%" />
            </div>
          </div>
        ))}
      </Skeleton>
    );
  },
});

export const Table = meta.story({
  args: {
    className: "w-full flex flex-col gap-3",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <div className="flex gap-4">
          <Skeleton.Item height="20px" width="150px" />
          <Skeleton.Item height="20px" width="200px" />
          <Skeleton.Item height="20px" width="120px" />
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton.Item height="40px" width="150px" />
            <Skeleton.Item height="40px" width="200px" />
            <Skeleton.Item height="40px" width="120px" />
          </div>
        ))}
      </Skeleton>
    );
  },
});

export const Profile = meta.story({
  args: {
    className: "w-80 flex flex-col gap-4",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <div className="flex items-center gap-4">
          <Skeleton.Item height="80px" width="80px" className="rounded-full" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton.Item height="20px" width="60%" />
            <Skeleton.Item height="16px" width="40%" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="16px" width="100%" />
          <Skeleton.Item height="16px" width="90%" />
          <Skeleton.Item height="16px" width="70%" />
        </div>
      </Skeleton>
    );
  },
});

export const Avatar = meta.story({
  args: {
    className: "flex gap-2",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="40px" width="40px" className="rounded-full" />
      </Skeleton>
    );
  },
});

export const AvatarGroup = meta.story({
  args: {
    className: "flex -space-x-2",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton.Item key={i} height="40px" width="40px" className="rounded-full border-2 border-white" />
        ))}
      </Skeleton>
    );
  },
});

export const Text = meta.story({
  args: {
    className: "w-96 flex flex-col gap-2",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="16px" width="100%" />
        <Skeleton.Item height="16px" width="95%" />
        <Skeleton.Item height="16px" width="90%" />
        <Skeleton.Item height="16px" width="60%" />
      </Skeleton>
    );
  },
});

export const Button = meta.story({
  args: {
    className: "inline-flex",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
});

export const Input = meta.story({
  args: {
    className: "w-80 flex flex-col gap-2",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="14px" width="80px" />
        <Skeleton.Item height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
});

export const Form = meta.story({
  args: {
    className: "w-96 flex flex-col gap-4",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="80px" />
          <Skeleton.Item height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="100px" />
          <Skeleton.Item height="40px" width="100%" className="rounded-md" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="14px" width="60px" />
          <Skeleton.Item height="80px" width="100%" className="rounded-md" />
        </div>
        <Skeleton.Item height="40px" width="120px" className="rounded-md" />
      </Skeleton>
    );
  },
});

export const ProductCard = meta.story({
  args: {
    className: "w-72 flex flex-col gap-3 p-4 border rounded-lg",
  },
  render(args) {
    return (
      <Skeleton {...args}>
        <Skeleton.Item height="200px" width="100%" className="rounded-md" />
        <div className="flex flex-col gap-2">
          <Skeleton.Item height="20px" width="80%" />
          <Skeleton.Item height="16px" width="60%" />
          <Skeleton.Item height="24px" width="40%" />
        </div>
        <Skeleton.Item height="40px" width="100%" className="rounded-md" />
      </Skeleton>
    );
  },
});
