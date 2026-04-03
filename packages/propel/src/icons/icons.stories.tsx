/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionsIconsMap,
  ArrowsIconsMap,
  LayoutIconsMap,
  MiscIconsMap,
  ProjectIconsMap,
  PropertyIconsMap,
  SubBrandIconsMap,
  WorkspaceIconsMap,
} from "./constants";
import { Icon } from "./icon";
import { CycleIcon } from "./project/cycle-icon";
import { HomeIcon } from "./workspace/home-icon";
import { ProjectIcon } from "./workspace/project-icon";

const meta: Meta = {
  title: "Icons",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A comprehensive collection of all icons used throughout the application. Supports both direct imports and registry-based usage.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AllIcons: Story = {
  render: () => (
    <div className="space-y-12">
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Sub-Brand Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {SubBrandIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Workspace Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {WorkspaceIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Project Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {ProjectIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Layout Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {LayoutIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Property Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {PropertyIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Actions Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {ActionsIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Arrows Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {ArrowsIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-center text-11 text-tertiary">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg text-custom-text-100 font-semibold">Misc Icons</h3>
        <div className="grid w-full grid-cols-12 gap-6">
          {MiscIconsMap.map((item) => (
            <div key={item.title} className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const RegistryUsage: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Registry-Based Usage</h3>
        <p className="text-13 text-tertiary">
          Use the <code className="rounded-sm bg-layer-1 px-1 py-0.5">Icon</code> component with{" "}
          <code className="rounded-sm bg-layer-1 px-1 py-0.5">name</code> prop for dynamic icon selection.
        </p>
        <div className="grid w-full grid-cols-12 gap-6">
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <Icon name="workspace.home" className="text-secondary" />
            <p className="text-center text-11 text-tertiary">workspace.home</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <Icon name="project.cycle" className="text-secondary" />
            <p className="text-center text-11 text-tertiary">project.cycle</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <Icon name="layout.board" className="text-secondary" />
            <p className="text-center text-11 text-tertiary">layout.board</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <Icon name="property.priority" className="text-secondary" />
            <p className="text-center text-11 text-tertiary">property.priority</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Direct Import Usage</h3>
        <p className="text-13 text-tertiary">
          Import icon components directly for better tree-shaking and type safety.
        </p>
        <div className="grid w-full grid-cols-12 gap-6">
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <HomeIcon className="text-secondary" />
            <p className="text-center text-11 text-tertiary">HomeIcon</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <CycleIcon className="text-secondary" />
            <p className="text-center text-11 text-tertiary">CycleIcon</p>
          </div>
          <div className="col-span-2 flex flex-col items-center justify-center gap-3 p-4">
            <ProjectIcon className="text-secondary" />
            <p className="text-center text-11 text-tertiary">ProjectIcon</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const IconSizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Icon Sizes</h3>
        <p className="text-13 text-tertiary">Icons can be rendered in different sizes using width and height props.</p>
      </div>

      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="12" height="12" className="text-secondary" />
          <p className="text-11 text-tertiary">12x12</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="16" height="16" className="text-secondary" />
          <p className="text-11 text-tertiary">16x16 (default)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="24" height="24" className="text-secondary" />
          <p className="text-11 text-tertiary">24x24</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="32" height="32" className="text-secondary" />
          <p className="text-11 text-tertiary">32x32</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="48" height="48" className="text-secondary" />
          <p className="text-11 text-tertiary">48x48</p>
        </div>
      </div>
    </div>
  ),
};
