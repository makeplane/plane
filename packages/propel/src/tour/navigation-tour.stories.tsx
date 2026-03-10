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
import { useArgs } from "storybook/preview-api";
import { fn } from "storybook/test";
import { Button } from "../button/button";
import { NavigationTour } from "./navigation-tour";
import type { NavigationTourStep } from "./navigation-tour-types";

const navigationTourSteps: NavigationTourStep[] = [
  {
    id: "sidebar",
    i18n_title: "Sidebar Navigation",
    i18n_description: "Use the sidebar to navigate between different sections of the application.",
    targetElement: "#nav-sidebar",
    position: "right-center" as NavigationTourStep["position"],
  },
  {
    id: "projects",
    i18n_title: "Projects Panel",
    i18n_description: "View and manage all your projects from this panel.",
    targetElement: "#nav-projects",
    position: "bottom-center" as NavigationTourStep["position"],
  },
  {
    id: "settings",
    i18n_title: "Settings",
    i18n_description: "Configure your workspace and project settings here.",
    targetElement: "#nav-settings",
    position: "left-center" as NavigationTourStep["position"],
  },
];

const meta = preview.meta({
  title: "Navigation/Navigation Tour",
  component: NavigationTour,
  parameters: {
    layout: "centered",
  },
  args: {
    isOpen: true,
    currentStep: 0,
    steps: navigationTourSteps,
    onClose: fn(),
    onNext: fn(),
    onPrevious: fn(),
  },
});

export const Default = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full">
        <div className="flex gap-4 mb-8">
          <div id="nav-sidebar" className="p-4 border rounded bg-layer-1 w-48">
            Sidebar
          </div>
          <div id="nav-projects" className="p-4 border rounded bg-layer-1 w-48">
            Projects
          </div>
          <div id="nav-settings" className="p-4 border rounded bg-layer-1 w-48">
            Settings
          </div>
        </div>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Navigation Tour
        </Button>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </div>
    );
  },
});

export const CustomConfig = meta.story({
  args: {
    steps: [navigationTourSteps[0]],
    config: { tooltipWidth: 400, positionOffset: 20 },
    className: "custom-nav-tour",
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full">
        <div id="nav-sidebar" className="p-4 border rounded bg-layer-1 w-48 mb-4">
          Target Element
        </div>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Custom Nav Tour
        </Button>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
      </div>
    );
  },
});

export const TopPosition = meta.story({
  args: {
    steps: [
      {
        id: "target",
        i18n_title: "Top Position",
        i18n_description: "Tooltip appears above the target element.",
        targetElement: "#top-target",
        position: "top-center" as NavigationTourStep["position"],
      },
    ],
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full pt-60">
        <div id="top-target" className="p-4 border rounded bg-layer-1 w-48">
          Target Below
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
      </div>
    );
  },
});

export const LeftPosition = meta.story({
  args: {
    steps: [
      {
        id: "target",
        i18n_title: "Left Position",
        i18n_description: "Tooltip appears to the left of the target element.",
        targetElement: "#left-target",
        position: "left-center" as NavigationTourStep["position"],
      },
    ],
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full flex justify-end">
        <div id="left-target" className="p-4 border rounded bg-layer-1 w-48">
          Target Right
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
      </div>
    );
  },
});

export const MissingTarget = meta.story({
  args: {
    steps: [
      {
        id: "missing",
        i18n_title: "Missing Target",
        i18n_description: "This target does not exist in the DOM.",
        targetElement: "#does-not-exist-element",
        position: "bottom-center" as NavigationTourStep["position"],
      },
    ],
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[200px] w-full">
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Open Missing Target Tour
        </Button>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
      </div>
    );
  },
  async play({ canvas, userEvent }) {
    await userEvent.click(canvas.getByRole("button", { name: "Open Missing Target Tour" }));
  },
});

export const WithResize = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full">
        <div id="nav-sidebar" className="p-4 border rounded bg-layer-1 w-48 mb-4">
          Sidebar
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </div>
    );
  },
});

const allPositionSteps: NavigationTourStep[] = [
  {
    id: "1",
    i18n_title: "Bottom Left",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "bottom-left" as NavigationTourStep["position"],
  },
  {
    id: "2",
    i18n_title: "Bottom Right",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "bottom-right" as NavigationTourStep["position"],
  },
  {
    id: "3",
    i18n_title: "Top Left",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "top-left" as NavigationTourStep["position"],
  },
  {
    id: "4",
    i18n_title: "Top Right",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "top-right" as NavigationTourStep["position"],
  },
  {
    id: "5",
    i18n_title: "Right Top",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "right-top" as NavigationTourStep["position"],
  },
  {
    id: "6",
    i18n_title: "Right Bottom",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "right-bottom" as NavigationTourStep["position"],
  },
  {
    id: "7",
    i18n_title: "Left Top",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "left-top" as NavigationTourStep["position"],
  },
  {
    id: "8",
    i18n_title: "Left Bottom",
    i18n_description: "desc",
    targetElement: "#pos-target",
    position: "left-bottom" as NavigationTourStep["position"],
  },
];

export const AllPositions = meta.story({
  args: {
    steps: allPositionSteps,
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[600px] w-full flex items-center justify-center">
        <div id="pos-target" className="p-4 border rounded bg-layer-1 w-32 text-center">
          Target
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, allPositionSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </div>
    );
  },
});

export const StepThrough = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full">
        <div className="flex gap-4 mb-8">
          <div id="nav-sidebar" className="p-4 border rounded bg-layer-1 w-48">
            Sidebar
          </div>
          <div id="nav-projects" className="p-4 border rounded bg-layer-1 w-48">
            Projects
          </div>
          <div id="nav-settings" className="p-4 border rounded bg-layer-1 w-48">
            Settings
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Button variant="primary" onClick={() => updateArgs({ isOpen: true, currentStep: 0 })}>
            Start
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })
            }
          >
            Next Nav
          </Button>
          <Button variant="secondary" onClick={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}>
            Prev Nav
          </Button>
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </div>
    );
  },
  async play({ canvas, userEvent }) {
    const nextBtn = canvas.getByRole("button", { name: "Next Nav" });
    const prevBtn = canvas.getByRole("button", { name: "Prev Nav" });
    await userEvent.click(nextBtn);
    await userEvent.click(nextBtn);
    await userEvent.click(prevBtn);
    await userEvent.click(prevBtn);
  },
});

export const InvalidPosition = meta.story({
  args: {
    steps: [
      {
        id: "invalid",
        i18n_title: "Invalid Position",
        i18n_description: "This uses an invalid position string.",
        targetElement: "#invalid-pos-target",
        position: "invalid-position" as NavigationTourStep["position"],
      },
    ],
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[300px] w-full">
        <div id="invalid-pos-target" className="p-4 border rounded bg-layer-1 w-48">
          Invalid Pos Target
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
      </div>
    );
  },
});

export const NoTarget = meta.story({
  args: {
    steps: [
      {
        id: "no-target",
        i18n_title: "No Target Element",
        i18n_description: "This step has no targetElement defined.",
      } as NavigationTourStep,
    ],
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[200px] w-full">
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: 0 })}
          onPrevious={() => updateArgs({ currentStep: 0 })}
        />
        <span data-testid="no-target-check">Rendered</span>
      </div>
    );
  },
});

export const RapidSteps = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <div className="relative min-h-[400px] w-full">
        <div className="flex gap-4 mb-8">
          <div id="nav-sidebar" className="p-4 border rounded bg-layer-1 w-48">
            Sidebar
          </div>
          <div id="nav-projects" className="p-4 border rounded bg-layer-1 w-48">
            Projects
          </div>
          <div id="nav-settings" className="p-4 border rounded bg-layer-1 w-48">
            Settings
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <Button
            variant="secondary"
            onClick={() =>
              updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })
            }
          >
            Rapid Next
          </Button>
          <Button variant="secondary" onClick={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}>
            Rapid Prev
          </Button>
        </div>
        <NavigationTour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, navigationTourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </div>
    );
  },
  async play({ canvas, userEvent }) {
    const nextBtn = canvas.getByRole("button", { name: "Rapid Next" });
    const prevBtn = canvas.getByRole("button", { name: "Rapid Prev" });
    await userEvent.click(nextBtn);
    await userEvent.click(nextBtn);
    await userEvent.click(prevBtn);
    await userEvent.click(prevBtn);
    await userEvent.click(nextBtn);
    await new Promise((resolve) => setTimeout(resolve, 300));
  },
});
