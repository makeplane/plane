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
import { Tour } from "./tour";
import { useTourState } from "./use-tour-state";
import { preloadTourAssets } from "./tour-preload";

const tourSteps = [
  {
    id: "welcome",
    i18n_title: "Welcome to Plane",
    i18n_description: "Let us show you around the key features of the application.",
  },
  {
    id: "projects",
    i18n_title: "Projects",
    i18n_description: "Organize your work into projects. Each project can have its own workflows and settings.",
  },
  {
    id: "issues",
    i18n_title: "Work Items",
    i18n_description: "Create and track work items to manage your team's tasks efficiently.",
  },
];

const tourStepsWithImages = [
  {
    id: "welcome",
    i18n_title: "Welcome to Plane",
    i18n_description: "Let us show you around the key features of the application.",
    asset:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='440' height='250'%3E%3Crect fill='%23334155' width='440' height='250'/%3E%3C/svg%3E",
  },
  {
    id: "projects",
    i18n_title: "Projects",
    i18n_description: "Organize your work into projects.",
    asset:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='440' height='250'%3E%3Crect fill='%23475569' width='440' height='250'/%3E%3C/svg%3E",
  },
  {
    id: "issues",
    i18n_title: "Work Items",
    i18n_description: "Create and track work items.",
    asset:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='440' height='250'%3E%3Crect fill='%23064e3b' width='440' height='250'/%3E%3C/svg%3E",
  },
];

const meta = preview.meta({
  title: "Navigation/Tour",
  component: Tour,
  parameters: {
    layout: "centered",
  },
  args: {
    isOpen: true,
    currentStep: 0,
    steps: tourSteps,
    onClose: fn(),
    onNext: fn(),
    onPrevious: fn(),
  },
});

export const Default = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Tour
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
});

export const WithImages = meta.story({
  args: {
    steps: tourStepsWithImages,
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Image Tour
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourStepsWithImages.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
});

export const WithPulseIndicator = meta.story({
  args: {
    steps: [{ ...tourSteps[0], targetElement: "#pulse-target" }, tourSteps[1], tourSteps[2]],
    showPulseIndicator: true,
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <div id="pulse-target" className="mb-4 p-4 border rounded">
          <span>Target Element for Pulse</span>
        </div>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Tour with Pulse
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
});

export const NoPulseIndicator = meta.story({
  args: {
    showPulseIndicator: false,
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start No Pulse Tour
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
});

export const WithCustomConfig = meta.story({
  args: {
    config: { popoverWidth: 500, popoverHeight: 300 },
    className: "custom-tour",
  },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Start Custom Tour
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
});

export const UseTourStateHook = meta.story({
  render: function Render(args) {
    const tourState = useTourState(tourSteps);
    return (
      <>
        <div className="space-x-2 flex flex-wrap gap-2">
          <Button variant="primary" onClick={tourState.openTour}>
            Open Tour
          </Button>
          <Button variant="secondary" onClick={tourState.nextTourStep}>
            Next Step
          </Button>
          <Button variant="secondary" onClick={tourState.previousTourStep}>
            Prev Step
          </Button>
          <Button variant="secondary" onClick={tourState.closeTour}>
            Close Tour
          </Button>
          <Button variant="secondary" onClick={() => tourState.goToStep(1)}>
            Go to Step 2
          </Button>
          <Button variant="secondary" onClick={() => tourState.goToStep(-1)}>
            Invalid Step
          </Button>
          <Button variant="secondary" onClick={() => tourState.goToStep(99)}>
            Out of Bounds
          </Button>
          <Button variant="secondary" onClick={tourState.resetTour}>
            Reset Tour
          </Button>
        </div>
        <Tour {...args} {...tourState} />
      </>
    );
  },
  async play({ canvas, userEvent }) {
    const openBtn = canvas.getByRole("button", { name: "Open Tour" });
    const nextBtn = canvas.getByRole("button", { name: "Next Step" });
    const prevBtn = canvas.getByRole("button", { name: "Prev Step" });
    const closeBtn = canvas.getByRole("button", { name: "Close Tour" });
    const invalidBtn = canvas.getByRole("button", { name: "Invalid Step" });
    const resetBtn = canvas.getByRole("button", { name: "Reset Tour" });
    // Exercise all useTourState branches:
    // 1. openTour (sets isOpen=true, currentStep=0)
    await userEvent.click(openBtn);
    // 2. nextTourStep (currentStep 0→1, covers step < length-1 branch)
    await userEvent.click(nextBtn);
    // 3. nextTourStep (currentStep 1→2)
    await userEvent.click(nextBtn);
    // 4. nextTourStep on last step (covers else branch → closeTour)
    await userEvent.click(nextBtn);
    // 5. Re-open, go to step 1, wait for animation ref to update, then previousTourStep
    //    (covers currentStep > 0 AND useTourAnimation direction="prev" branch)
    await userEvent.click(openBtn);
    await userEvent.click(nextBtn);
    // Wait for useTourAnimation's setTimeout (250ms) to update previousStepRef
    await new Promise((resolve) => setTimeout(resolve, 350));
    await userEvent.click(prevBtn);
    // 6. previousTourStep at step 0 (covers currentStep <= 0, no-op)
    await userEvent.click(prevBtn);
    // 7. closeTour explicitly
    await userEvent.click(closeBtn);
    // 8. goToStep with invalid index (covers step < 0 branch)
    await userEvent.click(invalidBtn);
    // 9. goToStep with out-of-bounds index (covers step >= steps.length branch)
    const oobBtn = canvas.getByRole("button", { name: "Out of Bounds" });
    await userEvent.click(oobBtn);
    // 10. resetTour
    await userEvent.click(resetBtn);
  },
});

export const ClosedTour = meta.story({
  args: { isOpen: false, currentStep: 0 },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true })}>
          Open Closed Tour
        </Button>
        <Tour {...args} isOpen={isOpen} currentStep={currentStep} onClose={() => updateArgs({ isOpen: false })} />
      </>
    );
  },
});

// Exercise preloadTourAssets (covers tour-preload.ts)
export const PreloadAssets = meta.story({
  render(_args) {
    // Call preloadTourAssets with data URIs (instant loading)
    void preloadTourAssets([
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E",
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E",
    ]);
    // Also exercise the empty/invalid paths
    void preloadTourAssets([]);
    void preloadTourAssets(["", "  "]);
    return <div data-testid="preload-done">Assets preloaded</div>;
  },
});

// Exercise step navigation to trigger useTourAnimation and useTourKeyboard
export const StepNavigation = meta.story({
  args: { isOpen: true, currentStep: 0, onStepChange: fn() },
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <div className="flex gap-2 mb-4">
          <Button variant="primary" onClick={() => updateArgs({ isOpen: true, currentStep: 0 })}>
            Open
          </Button>
          <Button
            variant="secondary"
            onClick={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          >
            Next
          </Button>
          <Button variant="secondary" onClick={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}>
            Prev
          </Button>
        </div>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
  async play({ canvas, userEvent }) {
    // Navigate through steps with delays to exercise useTourAnimation fully
    // (including the setTimeout callback at lines 47-48 that runs after 250ms)
    const nextBtn = canvas.getByRole("button", { name: "Next" });
    const prevBtn = canvas.getByRole("button", { name: "Prev" });
    // Forward: step 0→1 (direction="next")
    await userEvent.click(nextBtn);
    // Wait for animation timeout to complete (250ms + buffer)
    await new Promise((resolve) => setTimeout(resolve, 350));
    // Forward: step 1→2 (direction="next" again)
    await userEvent.click(nextBtn);
    await new Promise((resolve) => setTimeout(resolve, 350));
    // Backward: step 2→1 (direction="prev")
    await userEvent.click(prevBtn);
    await new Promise((resolve) => setTimeout(resolve, 350));
    // Backward: step 1→0 (direction="prev" again)
    await userEvent.click(prevBtn);
    await new Promise((resolve) => setTimeout(resolve, 350));
  },
});

export const KeyboardNavigation = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true, currentStep: 0 })}>
          Open Keyboard Tour
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
  async play({ userEvent }) {
    // Exercise useTourKeyboard: ArrowRight, ArrowLeft, Escape
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{Escape}");
  },
});

export const TourOutOfBoundsStep = meta.story({
  args: {
    isOpen: true,
    currentStep: 99,
  },
  render(args) {
    return <Tour {...args} />;
  },
});

export const TourOpenClose = meta.story({
  render: function Render(args) {
    const [{ isOpen, currentStep }, updateArgs] = useArgs<typeof args>();
    return (
      <>
        <Button variant="primary" onClick={() => updateArgs({ isOpen: true, currentStep: 0 })}>
          Open
        </Button>
        <Button variant="secondary" onClick={() => updateArgs({ isOpen: false })}>
          Close
        </Button>
        <Tour
          {...args}
          isOpen={isOpen}
          currentStep={currentStep}
          onClose={() => updateArgs({ isOpen: false, currentStep: 0 })}
          onNext={() => updateArgs({ currentStep: Math.min((currentStep ?? 0) + 1, tourSteps.length - 1) })}
          onPrevious={() => updateArgs({ currentStep: Math.max((currentStep ?? 0) - 1, 0) })}
        />
      </>
    );
  },
  async play({ canvas, userEvent }) {
    // Exercise useTourVisibility: open → close → reopen cycle
    const openBtn = canvas.getByRole("button", { name: "Open" });
    const closeBtn = canvas.getByRole("button", { name: "Close" });
    await userEvent.click(openBtn);
    await userEvent.click(closeBtn);
    await userEvent.click(openBtn);
    await userEvent.click(closeBtn);
  },
});
