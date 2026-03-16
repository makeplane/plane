/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import preview from "#.storybook/preview";
import { CheckIcon } from "../icons";
import { CircularProgressIndicator } from "./circular-progress-indicator";

const meta = preview.meta({
  component: CircularProgressIndicator,
  parameters: {
    layout: "centered",
  },
  args: {
    percentage: 42,
    size: 50,
    strokeWidth: 6,
    strokeColor: "stroke-success-secondary",
  },
});

export const Default = meta.story({
  args: {
    children: <span className="text-xs font-medium">42%</span>,
  },
});

export const WithLabel = Default.extend({
  args: {
    size: 40,
    strokeWidth: 6,
    strokeColor: "stroke-accent-primary",
    variant: "with-label",
    children: undefined,
  },
});

export const WithLabelHighProgress = WithLabel.extend({
  args: {
    percentage: 87,
  },
});

export const WithLabelLowProgress = WithLabel.extend({
  args: {
    percentage: 15,
  },
});

export const WithLabelComplete = WithLabel.extend({
  args: {
    percentage: 100,
    strokeColor: "stroke-success-primary",
  },
});

export const Segmented = Default.extend({
  args: {
    percentage: 65,
    strokeColor: "stroke-accent-primary",
    segmented: true,
    children: <span className="text-xs font-medium">65%</span>,
  },
});

export const WithCheckIcon = Default.extend({
  args: {
    percentage: 100,
    strokeColor: "stroke-success-primary",
    children: <CheckIcon className="h-4 w-4 stroke-2 text-success-primary" />,
  },
});

export const Small = Default.extend({
  args: {
    size: 24,
    percentage: 33,
    strokeWidth: 3,
    strokeColor: "stroke-accent-primary",
    children: <span className="text-[8px] font-medium">33%</span>,
  },
});

export const Large = Default.extend({
  args: {
    size: 80,
    percentage: 75,
    strokeWidth: 8,
    strokeColor: "stroke-success-primary",
    children: <span className="text-lg font-semibold">75%</span>,
  },
});

export const DifferentColors = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center gap-8">
      <CircularProgressIndicator size={40} percentage={42} strokeWidth={6} strokeColor="stroke-accent-primary">
        <span className="text-xs font-medium">42%</span>
      </CircularProgressIndicator>
      <CircularProgressIndicator size={40} percentage={65} strokeWidth={6} strokeColor="stroke-success-primary">
        <span className="text-xs font-medium">65%</span>
      </CircularProgressIndicator>
      <CircularProgressIndicator size={40} percentage={85} strokeWidth={6} strokeColor="stroke-warning-primary">
        <span className="text-xs font-medium">85%</span>
      </CircularProgressIndicator>
      <CircularProgressIndicator size={40} percentage={25} strokeWidth={6} strokeColor="stroke-error-primary">
        <span className="text-xs font-medium">25%</span>
      </CircularProgressIndicator>
    </div>
  ),
});

export const WithLabelVariants = meta.story({
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-secondary">0%:</span>
        <CircularProgressIndicator
          size={20}
          percentage={0}
          strokeWidth={4}
          strokeColor="stroke-accent-primary"
          variant="with-label"
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-secondary">25%:</span>
        <CircularProgressIndicator
          size={20}
          percentage={25}
          strokeWidth={4}
          strokeColor="stroke-accent-primary"
          variant="with-label"
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-secondary">50%:</span>
        <CircularProgressIndicator
          size={20}
          percentage={50}
          strokeWidth={4}
          strokeColor="stroke-accent-primary"
          variant="with-label"
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-secondary">75%:</span>
        <CircularProgressIndicator
          size={30}
          percentage={75}
          strokeWidth={3}
          strokeColor="stroke-accent-primary"
          variant="with-label"
        />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-sm text-secondary">100%:</span>
        <CircularProgressIndicator
          size={20}
          percentage={100}
          strokeWidth={4}
          strokeColor="stroke-success-primary"
          variant="with-label"
        />
      </div>
    </div>
  ),
});

export const Comparison = meta.story({
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-sm font-medium text-secondary">Default Variant</h3>
        <div className="flex items-center gap-6">
          <CircularProgressIndicator size={40} percentage={42} strokeWidth={6} strokeColor="stroke-accent-primary">
            <span className="text-xs font-medium">42%</span>
          </CircularProgressIndicator>
          <CircularProgressIndicator size={40} percentage={100} strokeWidth={6} strokeColor="stroke-success-primary">
            <CheckIcon className="h-4 w-4 stroke-2 text-success-primary" />
          </CircularProgressIndicator>
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-medium text-secondary">With Label Variant</h3>
        <div className="flex items-center gap-6">
          <CircularProgressIndicator
            size={30}
            percentage={42}
            strokeWidth={3}
            strokeColor="stroke-accent-primary"
            variant="with-label"
          />
          <CircularProgressIndicator
            size={30}
            percentage={100}
            strokeWidth={3}
            strokeColor="stroke-success-primary"
            variant="with-label"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-4 text-sm font-medium text-secondary">Segmented Variant</h3>
        <div className="flex items-center gap-6">
          <CircularProgressIndicator
            size={40}
            percentage={42}
            strokeWidth={6}
            strokeColor="stroke-accent-primary"
            segmented
          >
            <span className="text-xs font-medium">42%</span>
          </CircularProgressIndicator>
          <CircularProgressIndicator
            size={40}
            percentage={100}
            strokeWidth={6}
            strokeColor="stroke-success-primary"
            segmented
          >
            <CheckIcon className="h-4 w-4 stroke-2 text-success-primary" />
          </CircularProgressIndicator>
        </div>
      </div>
    </div>
  ),
});
