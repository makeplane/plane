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
        <div className="grid grid-cols-12 gap-6 w-full">
          {SubBrandIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Workspace Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {WorkspaceIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Project Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ProjectIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Layout Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {LayoutIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Property Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {PropertyIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Actions Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ActionsIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Arrows Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ArrowsIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-secondary">{item.icon}</div>
              <p className="text-11 text-tertiary text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Misc Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {MiscIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
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
          Use the <code className="px-1 py-0.5 bg-layer-1 rounded-sm">Icon</code> component with{" "}
          <code className="px-1 py-0.5 bg-layer-1 rounded-sm">name</code> prop for dynamic icon selection.
        </p>
        <div className="grid grid-cols-12 gap-6 w-full">
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="workspace.home" className="text-secondary" />
            <p className="text-11 text-tertiary text-center">workspace.home</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="project.cycle" className="text-secondary" />
            <p className="text-11 text-tertiary text-center">project.cycle</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="layout.board" className="text-secondary" />
            <p className="text-11 text-tertiary text-center">layout.board</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="property.priority" className="text-secondary" />
            <p className="text-11 text-tertiary text-center">property.priority</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-16 font-semibold text-primary">Direct Import Usage</h3>
        <p className="text-13 text-tertiary">
          Import icon components directly for better tree-shaking and type safety.
        </p>
        <div className="grid grid-cols-12 gap-6 w-full">
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <HomeIcon className="text-secondary" />
            <p className="text-11 text-tertiary text-center">HomeIcon</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <CycleIcon className="text-secondary" />
            <p className="text-11 text-tertiary text-center">CycleIcon</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <ProjectIcon className="text-secondary" />
            <p className="text-11 text-tertiary text-center">ProjectIcon</p>
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
