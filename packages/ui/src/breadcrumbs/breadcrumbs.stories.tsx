/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { HomeOutline, SettingsOutline } from "@makeplane/propel/icons";
import * as React from "react";
import { Breadcrumbs } from "./breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "UI/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
};

type TBreadcrumbBlockProps = {
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  disableTooltip?: boolean;
};

// TODO: remove this component and use web Link component
function BreadcrumbBlock(props: TBreadcrumbBlockProps) {
  const { label, icon, disableTooltip = false } = props;

  return (
    <>
      <Breadcrumbs.ItemWrapper label={label} disableTooltip={disableTooltip}>
        {icon && <div className="flex size-4 items-center justify-center overflow-hidden !text-16">{icon}</div>}
        {label && <div className="relative line-clamp-1 block max-w-[150px] truncate overflow-hidden">{label}</div>}
      </Breadcrumbs.ItemWrapper>
    </>
  );
}

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item key="projects" component={<BreadcrumbBlock href="/projects" label="Projects" />} />,
      <Breadcrumbs.Item
        key="current"
        component={<BreadcrumbBlock href="/projects/current" label="Current Project" />}
      />,
    ],
  },
};

export const WithLoading: Story = {
  args: {
    isLoading: true,
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item key="projects" component={<BreadcrumbBlock href="/projects" label="Projects" />} />,
    ],
  },
};

export const WithCustomComponent: Story = {
  args: {
    children: [
      <Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />,
      <Breadcrumbs.Item
        key="custom"
        component={
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 size-4 rounded-full" />
            <span>Custom Component</span>
          </div>
        }
      />,
    ],
  },
};

export const SingleItem: Story = {
  args: {
    children: [<Breadcrumbs.Item key="home" component={<BreadcrumbBlock href="/" label="Home" />} />],
  },
};

export const WithIcons: Story = {
  args: {
    children: [
      <Breadcrumbs.Item
        key="home"
        component={<BreadcrumbBlock href="/" label="Home" icon={<HomeOutline className="size-3.5" />} />}
      />,
      <Breadcrumbs.Item
        key="settings"
        component={
          <BreadcrumbBlock href="/settings" label="Settings" icon={<SettingsOutline className="size-3.5" />} />
        }
        isLast
      />,
    ],
  },
};
