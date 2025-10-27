import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionsIconsMap,
  ArrowsIconsMap,
  LayoutIconsMap,
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
        <h3 className="text-lg font-semibold text-custom-text-100">Sub-Brand Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {SubBrandIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Workspace Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {WorkspaceIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Project Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ProjectIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Layout Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {LayoutIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Property Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {PropertyIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Actions Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ActionsIconsMap.map((item) => (
            <div key={item.title} className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
              <div className="text-custom-text-200">{item.icon}</div>
              <p className="text-xs text-custom-text-300 text-center">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Arrows Icons</h3>
        <div className="grid grid-cols-12 gap-6 w-full">
          {ArrowsIconsMap.map((item) => (
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
        <h3 className="text-lg font-semibold text-custom-text-100">Registry-Based Usage</h3>
        <p className="text-sm text-custom-text-300">
          Use the <code className="px-1 py-0.5 bg-custom-background-80 rounded">Icon</code> component with{" "}
          <code className="px-1 py-0.5 bg-custom-background-80 rounded">name</code> prop for dynamic icon selection.
        </p>
        <div className="grid grid-cols-12 gap-6 w-full">
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="workspace.home" className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">workspace.home</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="project.cycle" className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">project.cycle</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="layout.board" className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">layout.board</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <Icon name="property.priority" className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">property.priority</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-custom-text-100">Direct Import Usage</h3>
        <p className="text-sm text-custom-text-300">
          Import icon components directly for better tree-shaking and type safety.
        </p>
        <div className="grid grid-cols-12 gap-6 w-full">
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <HomeIcon className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">HomeIcon</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <CycleIcon className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">CycleIcon</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-4 col-span-2">
            <ProjectIcon className="text-custom-text-200" />
            <p className="text-xs text-custom-text-300 text-center">ProjectIcon</p>
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
        <h3 className="text-lg font-semibold text-custom-text-100">Icon Sizes</h3>
        <p className="text-sm text-custom-text-300">
          Icons can be rendered in different sizes using width and height props.
        </p>
      </div>

      <div className="flex items-end gap-8">
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="12" height="12" className="text-custom-text-200" />
          <p className="text-xs text-custom-text-300">12x12</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="16" height="16" className="text-custom-text-200" />
          <p className="text-xs text-custom-text-300">16x16 (default)</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="24" height="24" className="text-custom-text-200" />
          <p className="text-xs text-custom-text-300">24x24</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="32" height="32" className="text-custom-text-200" />
          <p className="text-xs text-custom-text-300">32x32</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Icon name="workspace.home" width="48" height="48" className="text-custom-text-200" />
          <p className="text-xs text-custom-text-300">48x48</p>
        </div>
      </div>
    </div>
  ),
};
