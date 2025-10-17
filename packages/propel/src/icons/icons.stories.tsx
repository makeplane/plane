import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ActionsIconsMap,
  LayoutIconsMap,
  ProjectIconsMap,
  PropertyIconsMap,
  SubBrandIconsMap,
  WorkspaceIconsMap,
} from "./constants";

const meta: Meta = {
  title: "Icons",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "A comprehensive collection of all icons used throughout the application, grouped by category.",
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
    </div>
  ),
};
