import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollArea } from "./scrollarea";

const meta: Meta<typeof ScrollArea> = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A customizable scroll area component with multiple size variants, scroll behaviors, and orientations.",
      },
    },
  },
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["vertical", "horizontal"],
      description: "Orientation of the scrollbar",
      table: {
        type: { summary: "ScrollAreaOrientation" },
        defaultValue: { summary: "vertical" },
      },
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
      description: "Size variant of the scrollbar",
      table: {
        type: { summary: "ScrollAreaSize" },
        defaultValue: { summary: "md" },
      },
    },
    scrollType: {
      control: { type: "select" },
      options: ["always", "scroll", "hover"],
      description: "When to show the scrollbar",
      table: {
        type: { summary: "ScrollAreaScrollType" },
        defaultValue: { summary: "always" },
      },
    },
    className: {
      control: { type: "text" },
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

// Sample content components for stories
const LongTextContent = () => (
  <div className="p-4 space-y-4">
    <h3 className="text-lg font-semibold">Long Text Content</h3>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat.
    </p>
    <p>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
      sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p>
      Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem
      aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
    </p>
    <p>
      Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores
      eos qui ratione voluptatem sequi nesciunt.
    </p>
    <p>
      Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam
      eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
    </p>
    <p>
      Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea
      commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae
      consequatur.
    </p>
  </div>
);

// Default story
export const Default: Story = {
  args: {
    className: "h-64 w-80 border rounded-lg",
    size: "md",
    scrollType: "always",
    orientation: "vertical",
  },
  render: (args) => (
    <ScrollArea {...args}>
      <LongTextContent />
    </ScrollArea>
  ),
};
