import type { Meta, StoryObj } from "@storybook/react-vite";
import { ContextMenu } from "./context-menu";

const meta: Meta<typeof ContextMenu> = {
  title: "Components/ContextMenu",
  component: ContextMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenu.Trigger>
        <div className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed border-custom-border-300 text-sm">
          Right click here
        </div>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content>
          <ContextMenu.Item>Back</ContextMenu.Item>
          <ContextMenu.Item>Forward</ContextMenu.Item>
          <ContextMenu.Item>Reload</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item>More Tools</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu>
  ),
};
