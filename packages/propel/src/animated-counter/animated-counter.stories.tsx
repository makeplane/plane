import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedCounter } from "./animated-counter";

const meta: Meta<typeof AnimatedCounter> = {
  title: "AnimatedCounter",
  component: AnimatedCounter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AnimatedCounter>;

const AnimatedCounterDemo = (args: React.ComponentProps<typeof AnimatedCounter>) => {
  const [count, setCount] = useState(args.count || 0);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-center gap-6">
        <button
          className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors shadow-md"
          onClick={() => setCount((prev) => Math.max(0, prev - 1))}
        >
          -1
        </button>
        <div className="flex items-center justify-center min-w-[60px] h-12 bg-gray-50 border border-gray-200 rounded-lg">
          <AnimatedCounter {...args} count={count} />
        </div>
        <button
          className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-colors shadow-md"
          onClick={() => setCount((prev) => prev + 1)}
        >
          +1
        </button>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: (args) => <AnimatedCounterDemo {...args} />,
  args: {
    count: 5,
    size: "md",
  },
};
