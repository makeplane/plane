/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
            className="bg-red-500 hover:bg-red-600 shadow-md rounded-lg px-4 py-2 font-medium text-on-color transition-colors focus:ring-2 focus:ring-danger-strong focus:ring-offset-2 focus:outline-none"
            onClick={() => setCount((prev) => Math.max(0, prev - 1))}
          >
            -1
          </button>
          <div className="bg-gray-50 border-gray-200 flex h-12 min-w-[60px] items-center justify-center rounded-lg border">
            <AnimatedCounter {...args} count={count} />
          </div>
          <button
            className="bg-green-500 hover:bg-green-600 shadow-md rounded-lg px-4 py-2 font-medium text-on-color transition-colors focus:ring-2 focus:ring-success-strong focus:ring-offset-2 focus:outline-none"
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
            className="rounded-sm bg-layer-1 px-3 py-1 text-13 hover:bg-surface-2"
            onClick={() => setCount((prev) => Math.max(0, prev - 1))}
          >
            -1
          </button>
          <button
            className="rounded-sm bg-layer-1 px-3 py-1 text-13 hover:bg-surface-2"
            onClick={() => setCount((prev) => prev + 1)}
          >
            +1
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="w-20 text-13 text-placeholder">Small:</span>
            <div className="flex h-8 min-w-[40px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
              <AnimatedCounter count={count} size="sm" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-13 text-placeholder">Medium:</span>
            <div className="flex h-10 min-w-[50px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
              <AnimatedCounter count={count} size="md" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-20 text-13 text-placeholder">Large:</span>
            <div className="flex h-12 min-w-[60px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
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
            className="bg-red-500 hover:bg-red-600 rounded-sm px-3 py-1 text-13 text-on-color"
            onClick={() => setCount((prev) => Math.max(0, prev - 1000))}
          >
            -1000
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 rounded-sm px-3 py-1 text-13 text-on-color"
            onClick={() => setCount((prev) => prev + 1000)}
          >
            +1000
          </button>
        </div>
        <div className="flex h-12 min-w-[100px] items-center justify-center rounded-lg border border-subtle bg-layer-1">
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
          <div className="flex h-16 min-w-[60px] items-center justify-center rounded-lg border-2 border-subtle bg-layer-1">
            <AnimatedCounter count={count} size="lg" className="text-20" />
          </div>
          <button
            className="rounded-lg bg-accent-primary px-6 py-2 font-medium text-on-color hover:bg-accent-primary/80"
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
          <div className="flex h-16 min-w-[80px] items-center justify-center rounded-lg border-2 border-subtle bg-layer-1">
            <AnimatedCounter count={count} size="lg" className="text-20" />
          </div>
          <div className="flex gap-2">
            <button
              className="bg-green-500 hover:bg-green-600 rounded-sm px-4 py-2 font-medium text-on-color"
              onClick={() => setIsRunning(true)}
              disabled={isRunning}
            >
              Start
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 rounded-sm px-4 py-2 font-medium text-on-color"
              onClick={() => setIsRunning(false)}
              disabled={!isRunning}
            >
              Stop
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 rounded-sm px-4 py-2 font-medium text-on-color"
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
        <div className="max-w-md rounded-lg border border-subtle p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Engagement Stats</h3>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="text-13 text-placeholder">Likes</div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-sm bg-layer-1 hover:bg-surface-2"
                  onClick={() => setLikes((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex h-10 min-w-[40px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
                  <AnimatedCounter count={likes} size="md" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="text-13 text-placeholder">Comments</div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-sm bg-layer-1 hover:bg-surface-2"
                  onClick={() => setComments((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex h-10 min-w-[40px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
                  <AnimatedCounter count={comments} size="md" />
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2">
              <div className="text-13 text-placeholder">Shares</div>
              <div className="flex items-center gap-2">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-sm bg-layer-1 hover:bg-surface-2"
                  onClick={() => setShares((prev) => prev + 1)}
                >
                  +
                </button>
                <div className="flex h-10 min-w-[40px] items-center justify-center rounded-sm border border-subtle bg-layer-1">
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
            <button className="rounded-lg border border-subtle bg-layer-1 px-4 py-2">Notifications</button>
            <div className="bg-red-500 absolute -top-2 -right-2 flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-on-color">
              <AnimatedCounter count={notifications} size="sm" className="text-11 font-medium" />
            </div>
          </div>
          <button
            className="rounded-sm bg-accent-primary px-4 py-2 text-on-color hover:bg-accent-primary/80"
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
          <div className="flex h-12 min-w-[60px] items-center justify-center rounded-lg border border-subtle bg-layer-1">
            <AnimatedCounter count={count} size="lg" />
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-sm bg-accent-primary px-4 py-2 text-on-color hover:bg-accent-primary/80"
              onClick={incrementFast}
            >
              +10 Fast
            </button>
            <button className="rounded-sm bg-layer-1 px-4 py-2 hover:bg-surface-2" onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
        </div>
      </div>
    );
  },
};
