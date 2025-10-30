import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedCounter } from "./animated-counter";

const meta = {
  title: "Components/AnimatedCounter",
  component: AnimatedCounter,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    size: "md",
    count: 0,
  },
} satisfies Meta<typeof AnimatedCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render(args) {
    const [count, setCount] = useState(0);

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
  },
};

export const Sizes: Story = {
  render() {
    const [count, setCount] = useState(42);

    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <button
            className="px-3 py-1 bg-custom-background-80 text-sm rounded hover:bg-custom-background-90"
            onClick={() => setCount((prev) => Math.max(0, prev - 1))}
          >
            -1
          </button>
          <button
            className="px-3 py-1 bg-custom-background-80 text-sm rounded hover:bg-custom-background-90"
            onClick={() => setCount((prev) => prev + 1)}
          >
            +1
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-custom-text-400 w-20">Small:</span>
            <div className="flex items-center justify-center min-w-[40px] h-8 bg-custom-background-80 border border-custom-border-200 rounded">
              <AnimatedCounter count={count} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-custom-text-400 w-20">Medium:</span>
            <div className="flex items-center justify-center min-w-[50px] h-10 bg-custom-background-80 border border-custom-border-200 rounded">
              <AnimatedCounter count={count} size="md" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-custom-text-400 w-20">Large:</span>
            <div className="flex items-center justify-center min-w-[60px] h-12 bg-custom-background-80 border border-custom-border-200 rounded">
              <AnimatedCounter count={count} size="lg" />
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const LargeNumbers: Story = {
  render() {
    const [count, setCount] = useState(1234567);

    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <button
            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            onClick={() => setCount((prev) => Math.max(0, prev - 1000))}
          >
            -1000
          </button>
          <button
            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
            onClick={() => setCount((prev) => prev + 1000)}
          >
            +1000
          </button>
        </div>
        <div className="flex items-center justify-center min-w-[100px] h-12 bg-custom-background-80 border border-custom-border-200 rounded-lg">
          <AnimatedCounter count={count} size="lg" />
        </div>
      </div>
    );
  },
};

export const Countdown: Story = {
  render() {
    const [count, setCount] = useState(10);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
      if (isRunning && count > 0) {
        const timer = setTimeout(() => setCount((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
      }
      if (count === 0) {
        setIsRunning(false);
      }
    }, [count, isRunning]);

    const handleStart = () => {
      setCount(10);
      setIsRunning(true);
    };

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center min-w-[60px] h-16 bg-custom-background-80 border-2 border-custom-border-200 rounded-lg">
            <AnimatedCounter count={count} size="lg" className="text-2xl" />
          </div>
          <button
            className="px-6 py-2 bg-custom-primary-100 text-white font-medium rounded-lg hover:bg-custom-primary-200"
            onClick={handleStart}
            disabled={isRunning}
          >
            {isRunning ? "Counting..." : "Start Countdown"}
          </button>
        </div>
      </div>
    );
  },
};

export const LiveCounter: Story = {
  render() {
    const [count, setCount] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
      if (isRunning) {
        const timer = setInterval(() => setCount((prev) => prev + 1), 500);
        return () => clearInterval(timer);
      }
    }, [isRunning]);

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center min-w-[80px] h-16 bg-custom-background-80 border-2 border-custom-border-200 rounded-lg">
            <AnimatedCounter count={count} size="lg" className="text-2xl" />
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-500 text-white font-medium rounded hover:bg-green-600"
              onClick={() => setIsRunning(true)}
              disabled={isRunning}
            >
              Start
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white font-medium rounded hover:bg-red-600"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
            >
              Stop
            </button>
            <button
              className="px-4 py-2 bg-gray-500 text-white font-medium rounded hover:bg-gray-600"
              onClick={() => {
                setIsRunning(false);
                setCount(0);
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  },
};

export const MultipleCounters: Story = {
  render() {
    const [likes, setLikes] = useState(42);
    const [comments, setComments] = useState(15);
    const [shares, setShares] = useState(8);

    return (
      <div className="space-y-6 p-4">
        <div className="max-w-md border border-custom-border-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Engagement Stats</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="text-custom-text-400 text-sm">Likes</div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 flex items-center justify-center bg-custom-background-80 rounded hover:bg-custom-background-90"
                  onClick={() => setLikes((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex items-center justify-center min-w-[40px] h-10 bg-custom-background-80 border border-custom-border-200 rounded">
                  <AnimatedCounter count={likes} size="md" />
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="text-custom-text-400 text-sm">Comments</div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 flex items-center justify-center bg-custom-background-80 rounded hover:bg-custom-background-90"
                  onClick={() => setComments((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex items-center justify-center min-w-[40px] h-10 bg-custom-background-80 border border-custom-border-200 rounded">
                  <AnimatedCounter count={comments} size="md" />
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="text-custom-text-400 text-sm">Shares</div>
              <div className="flex items-center gap-2">
                <button
                  className="w-8 h-8 flex items-center justify-center bg-custom-background-80 rounded hover:bg-custom-background-90"
                  onClick={() => setShares((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex items-center justify-center min-w-[40px] h-10 bg-custom-background-80 border border-custom-border-200 rounded">
                  <AnimatedCounter count={shares} size="md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const InBadge: Story = {
  render() {
    const [notifications, setNotifications] = useState(3);

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <button className="px-4 py-2 bg-custom-background-80 border border-custom-border-200 rounded-lg">
              Notifications
            </button>
            <div className="absolute -top-2 -right-2 min-w-[24px] h-6 flex items-center justify-center bg-red-500 text-white rounded-full px-1.5">
              <AnimatedCounter count={notifications} size="sm" className="text-xs font-medium" />
            </div>
          </div>
          <button
            className="px-4 py-2 bg-custom-primary-100 text-white rounded hover:bg-custom-primary-200"
            onClick={() => setNotifications((prev) => prev + 1)}
          >
            Add Notification
          </button>
        </div>
      </div>
    );
  },
};

export const FastAnimation: Story = {
  render() {
    const [count, setCount] = useState(0);

    const incrementFast = () => {
      for (let i = 1; i <= 10; i++) {
        setTimeout(() => setCount((prev) => prev + 1), i * 50);
      }
    };

    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center min-w-[60px] h-12 bg-custom-background-80 border border-custom-border-200 rounded-lg">
            <AnimatedCounter count={count} size="lg" />
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-custom-primary-100 text-white rounded hover:bg-custom-primary-200"
              onClick={incrementFast}
            >
              +10 Fast
            </button>
            <button
              className="px-4 py-2 bg-custom-background-80 rounded hover:bg-custom-background-90"
              onClick={() => setCount(0)}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  },
};
