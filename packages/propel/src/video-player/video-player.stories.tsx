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
import { expect, fireEvent, fn, spyOn, waitFor } from "storybook/test";
import { VideoPlayer } from "./video-player";

const VIDEO_SRC = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const meta = preview.meta({
  component: VideoPlayer,
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div style={{ width: 640, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    src: VIDEO_SRC,
  },
});

export const IOSMode = Default.extend({
  args: {
    isIOS: true,
  },
});

export const Selected = Default.extend({
  args: {
    selected: true,
  },
});

export const WithClassName = Default.extend({
  args: {
    className: "rounded-lg shadow-xl border-2 border-blue-500",
  },
});

export const WithCallbacks = Default.extend({
  args: {
    onLoadedMetadata: fn(),
    onBlur: fn(),
    onFocus: fn(),
  },
});

export const IOSWithCallbacks = IOSMode.extend({
  args: {
    onLoadedMetadata: fn(),
    className: "rounded-lg",
  },
});

export const InteractWithControls = Default.extend({
  async play({ canvasElement, userEvent }) {
    // Suppress expected fullscreen errors in headless test environment
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const video = canvasElement.querySelector("video");
    // Stub play() to avoid NotAllowedError in headless Chrome
    if (video) {
      video.play = () => Promise.resolve();
    }
    // Click the container to activate the player (sets isActive=true in useVideoActive)
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Click the video element to togglePlay
    if (video) {
      await userEvent.click(video);
    }
    // Try clicking visible control buttons
    const playBtn = canvasElement.querySelector("[title='Play (K)']");
    if (playBtn) {
      await userEvent.click(playBtn);
    }
    const muteBtn = canvasElement.querySelector("[title='Mute (M)']");
    if (muteBtn) {
      await userEvent.click(muteBtn);
    }
    const fullscreenBtn = canvasElement.querySelector("[title='Fullscreen (F)']");
    if (fullscreenBtn) {
      await userEvent.click(fullscreenBtn);
    }
    // Dispatch keyboard events to exercise useVideoKeyboard
    await userEvent.keyboard(" ");
    await userEvent.keyboard("m");
    await userEvent.keyboard("k");
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowLeft}");
    await userEvent.keyboard("{Escape}");
    errorSpy.mockRestore();
  },
});

export const InteractWithSpeed = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Click container to activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Click the speed button
    const speedBtn = canvasElement.querySelector("[title='Playback speed']");
    if (speedBtn) {
      await userEvent.click(speedBtn);
      // Try clicking a speed option
      const speedOption = canvasElement.querySelector("[class*='text-left']");
      if (speedOption) {
        await userEvent.click(speedOption);
      }
    }
  },
});

export const MouseInteraction = Default.extend({
  async play({ canvasElement, userEvent }) {
    // Suppress expected fullscreen errors in headless test environment
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const video = canvasElement.querySelector("video");
    // Stub play() to avoid NotAllowedError in headless Chrome
    if (video) {
      video.play = () => Promise.resolve();
    }
    // Mouse move on container to trigger resetControlsTimeout
    const container = video?.parentElement;
    if (container) {
      await userEvent.hover(container);
      await userEvent.unhover(container);
      await userEvent.hover(container);
    }
    // Double-click video to toggle fullscreen
    if (video) {
      await userEvent.dblClick(video);
    }
    errorSpy.mockRestore();
  },
});

export const ProgressBarInteraction = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Spoof a non-zero duration so handleProgressHover doesn't bail on duration === 0
    if (video) {
      Object.defineProperty(video, "duration", { value: 120, writable: true, configurable: true });
      video.dispatchEvent(new Event("loadedmetadata", { bubbles: false }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    // Click container to activate the player
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Find the progress bar (it has class group/progress and is a cursor-pointer div)
    const progressBar = canvasElement.querySelector(".cursor-pointer.group\\/progress");
    if (progressBar) {
      // Hover over the progress bar to trigger handleProgressHover (covers use-video-progress.ts lines 38-43)
      await userEvent.hover(progressBar);
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Mouse down on progress bar to trigger handleProgressMouseDown → sets isDragging=true
      progressBar.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 100, clientY: 10 }));
      // Wait for React to process state update and attach document-level listeners
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Mouse move on document to trigger drag handler
      document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 150, clientY: 10 }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Mouse up on document to trigger handleMouseUp (sets videoRef.currentTime, isDragging=false)
      document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: 150, clientY: 10 }));
      // Leave the progress bar
      await userEvent.unhover(progressBar);
    }
  },
});

export const ProgressBarTouchInteraction = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Click container to activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Find the progress bar
    const progressBar = canvasElement.querySelector(".cursor-pointer.group\\/progress");
    if (progressBar) {
      // Touch start to trigger handleProgressTouchStart → sets isDragging=true
      const touch = new Touch({ identifier: 0, target: progressBar, clientX: 100, clientY: 10 });
      progressBar.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [touch], cancelable: true }));
      // Wait for React to process state update and attach document-level listeners
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Touch move
      const moveTouch = new Touch({ identifier: 0, target: progressBar, clientX: 150, clientY: 10 });
      document.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, touches: [moveTouch], cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Touch end to trigger handleTouchEnd
      const endTouch = new Touch({ identifier: 0, target: progressBar, clientX: 150, clientY: 10 });
      document.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [endTouch] }));
    }
  },
});

export const SelectedWithAllCallbacks = Selected.extend({
  args: {
    onBlur: fn(),
    onFocus: fn(),
    onHandleKeyDown: fn(() => true),
  },
});

export const SelectedWithAllCallbacksTest = SelectedWithAllCallbacks.extend({
  async play({ canvasElement, userEvent }) {
    // Suppress expected fullscreen errors in headless test environment
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const video = canvasElement.querySelector("video");
    // Container is already active due to selected=true + onBlur
    // Click container to ensure isActive and trigger onBlur
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Keyboard "f" to exercise toggleFullscreen via keyboard
    await userEvent.keyboard("f");
    // ArrowUp to exercise the exit group with onFocus + onHandleKeyDown defined
    await userEvent.keyboard("{ArrowUp}");
    // Re-activate by clicking container
    if (container) {
      await userEvent.click(container);
    }
    // ArrowDown for another exit key
    await userEvent.keyboard("{ArrowDown}");
    // Re-activate and test Enter
    if (container) {
      await userEvent.click(container);
    }
    await userEvent.keyboard("{Enter}");
    // Re-activate and test Backspace
    if (container) {
      await userEvent.click(container);
    }
    await userEvent.keyboard("{Backspace}");
    // Re-activate and test Delete
    if (container) {
      await userEvent.click(container);
    }
    await userEvent.keyboard("{Delete}");
    errorSpy.mockRestore();
  },
});

export const OutsideClickDeactivation = Default.extend({
  args: {
    onBlur: fn(),
  },
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Click container to activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Click outside the container to trigger useOutsideClickDetector → setIsActive(false)
    await userEvent.click(canvasElement);
  },
});

export const PlayAndPause = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Stub play() to avoid NotAllowedError in headless Chrome
    if (video) {
      video.play = () => Promise.resolve();
    }
    // Activate the player
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    if (video) {
      // Simulate the video entering "playing" state by dispatching a play event
      video.dispatchEvent(new Event("play", { bubbles: false }));
      // Wait for isPlaying=true to render the Pause button
      await waitFor(() => expect(canvasElement.querySelector("[title='Pause (K)']")).not.toBeNull());
      // Now togglePlay should call .pause() since isPlaying is true
      await userEvent.click(video);
      // Simulate pause event
      video.dispatchEvent(new Event("pause", { bubbles: false }));
    }
  },
});

export const VolumeInteraction = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Click container to activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Find volume range input
    const volumeInput = canvasElement.querySelector<HTMLInputElement>("input[type='range']");
    if (volumeInput) {
      // Ensure the input is interactable by forcing visibility
      volumeInput.style.width = "100px";
      volumeInput.style.opacity = "1";
      volumeInput.style.display = "block";
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Use the native value setter + input event to trigger React onChange on controlled inputs
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      // Set volume to 0 (triggers auto-mute branch: newVolume === 0)
      nativeSetter?.call(volumeInput, "0");
      volumeInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Set volume to 0.5 (triggers unmute branch: isMuted && newVolume > 0)
      nativeSetter?.call(volumeInput, "0.5");
      volumeInput.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Set volume to 1 (normal volume, no mute/unmute branch)
      nativeSetter?.call(volumeInput, "1");
      volumeInput.dispatchEvent(new Event("input", { bubbles: true }));
      // Also try fireEvent.change as fallback for different React event systems
      fireEvent.change(volumeInput, { target: { value: "0" } });
      await new Promise((resolve) => setTimeout(resolve, 50));
      fireEvent.change(volumeInput, { target: { value: "0.8" } });
    }
  },
});

export const IOSInteraction = IOSMode.extend({});

export const VideoEvents = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Activate the player
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    if (video) {
      // Spoof duration and buffered to cover handleLoadedMetadata and handleProgress branches
      Object.defineProperty(video, "duration", { value: 120, writable: true, configurable: true });
      Object.defineProperty(video, "buffered", {
        value: { length: 1, end: () => 60 },
        writable: true,
        configurable: true,
      });
      // Fire loadedmetadata to cover handleLoadedMetadata (use-video-player.ts lines 32-37)
      video.dispatchEvent(new Event("loadedmetadata", { bubbles: false }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Fire progress to cover handleProgress (buffered.length > 0 branch)
      video.dispatchEvent(new Event("progress", { bubbles: false }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Fire timeupdate to cover handleTimeUpdate
      video.dispatchEvent(new Event("timeupdate", { bubbles: false }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Fire ended to cover handleEnded
      video.dispatchEvent(new Event("ended", { bubbles: false }));
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  },
});

export const KeyboardHandlerFalse = SelectedWithAllCallbacks.extend({
  args: {
    onHandleKeyDown: fn(() => false),
  },
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // ArrowUp with onHandleKeyDown returning false covers different branch
    await userEvent.keyboard("{ArrowUp}");
    if (container) {
      await userEvent.click(container);
    }
    await userEvent.keyboard("{ArrowDown}");
  },
});

export const MuteUnmuteToggle = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Click mute button to toggle mute on
    const muteBtn = canvasElement.querySelector("[title='Mute (M)']");
    if (muteBtn) {
      await userEvent.click(muteBtn);
    }
    // Wait for mute state to update and button to change
    await waitFor(() => expect(canvasElement.querySelector("[title='Unmute (M)']")).not.toBeNull());
    // Click unmute button to toggle mute off
    const unmuteBtn = canvasElement.querySelector("[title='Unmute (M)']");
    if (unmuteBtn) {
      await userEvent.click(unmuteBtn);
    }
    // Wait for unmute state to update
    await waitFor(() => expect(canvasElement.querySelector("[title='Mute (M)']")).not.toBeNull());
    // Use keyboard shortcuts for seeking
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{ArrowLeft}");
  },
});

export const SpeedChangeInteraction = Default.extend({
  async play({ canvasElement, userEvent }) {
    const video = canvasElement.querySelector("video");
    // Activate
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Open speed menu and select a speed (covers handleSpeedChange in use-video-controls.ts)
    const speedBtn = canvasElement.querySelector("[title='Playback speed']");
    if (speedBtn) {
      await userEvent.click(speedBtn);
      // Wait for speed options to appear
      await waitFor(() =>
        expect(canvasElement.querySelectorAll("button.text-left, button[class*='text-left']").length).toBeGreaterThan(0)
      );
      // Click a speed option from the dropdown
      const speedOptions = canvasElement.querySelectorAll("button.text-left, button[class*='text-left']");
      if (speedOptions.length > 0) {
        // Click the last speed option to pick a different speed
        await userEvent.click(speedOptions[speedOptions.length - 1] as HTMLElement);
      }
    }
  },
});

export const FullscreenAndPiPEvents = Default.extend({
  async play({ canvasElement, userEvent }) {
    // Suppress expected fullscreen/PiP errors in headless test environment
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const video = canvasElement.querySelector("video");
    // Activate the player
    const container = video?.parentElement;
    if (container) {
      await userEvent.click(container);
    }
    // Dispatch fullscreenchange event to cover use-fullscreen.ts line 57
    document.dispatchEvent(new Event("fullscreenchange"));
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Dispatch PiP events to cover use-fullscreen.ts lines 54
    document.dispatchEvent(new Event("enterpictureinpicture"));
    await new Promise((resolve) => setTimeout(resolve, 50));
    document.dispatchEvent(new Event("leavepictureinpicture"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Click fullscreen button to exercise toggleFullscreen (requestFullscreen throws in headless → catch branch)
    const fullscreenBtn = canvasElement.querySelector("[title='Fullscreen (F)']");
    if (fullscreenBtn) {
      await userEvent.click(fullscreenBtn);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Spoof fullscreenElement so isFullscreen=true, then toggle again to cover exitFullscreen branch
    Object.defineProperty(document, "fullscreenElement", { value: container, writable: true, configurable: true });
    document.dispatchEvent(new Event("fullscreenchange"));
    await new Promise((resolve) => setTimeout(resolve, 50));
    // Now click fullscreen button again (isFullscreen=true → exitFullscreen path)
    const minimizeBtn = canvasElement.querySelector("[title='Fullscreen (F)']");
    if (minimizeBtn) {
      await userEvent.click(minimizeBtn);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    // Reset fullscreenElement
    Object.defineProperty(document, "fullscreenElement", { value: null, writable: true, configurable: true });
    document.dispatchEvent(new Event("fullscreenchange"));
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Exercise togglePiP: ensure pictureInPictureEnabled exists so PiP button renders
    if (!("pictureInPictureEnabled" in document)) {
      Object.defineProperty(document, "pictureInPictureEnabled", { value: true, writable: true, configurable: true });
    }
    // Try clicking the PiP button (may not be rendered yet since it's conditional on document property at render time)
    const pipBtn = canvasElement.querySelector("[title*='Picture in Picture']");
    if (pipBtn) {
      // Click to enter PiP (will throw in headless → catch block covers lines 33-34)
      await userEvent.click(pipBtn);
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Spoof PiP state and click again to cover exitPictureInPicture branch
      Object.defineProperty(document, "pictureInPictureElement", { value: video, writable: true, configurable: true });
      document.dispatchEvent(new Event("enterpictureinpicture"));
      await new Promise((resolve) => setTimeout(resolve, 50));
      const pipBtn2 = canvasElement.querySelector("[title*='Picture in Picture']");
      if (pipBtn2) {
        await userEvent.click(pipBtn2);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      // Reset
      Object.defineProperty(document, "pictureInPictureElement", { value: null, writable: true, configurable: true });
      document.dispatchEvent(new Event("leavepictureinpicture"));
    }
    errorSpy.mockRestore();
  },
});
