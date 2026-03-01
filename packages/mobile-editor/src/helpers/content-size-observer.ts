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

/**
 * Content Size Observer for Editor
 *
 * This module handles automatic detection of content height changes in the editor,
 * particularly for async-loading components like videos, images, and iframes.
 * It uses ResizeObserver and event listeners to ensure accurate height calculations
 * when media elements load after initial render.
 *
 * Note: Media elements are already in the DOM when rendered, they just change size
 * when they load. ResizeObserver handles these size changes automatically.
 */

import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative } from "./flutter-callback.helper";

interface ContentSizeObserverOptions {
  /** CSS selector for the editor container element */
  containerSelector?: string;
  /** Callback function to be called when content size changes */
  onSizeChanged?: (height: number) => void;
  /** Delay in milliseconds before notifying size changes (allows rendering to complete) */
  notificationDelay?: number;
  /** Whether to observe media elements (video, img, iframe) */
  observeMediaElements?: boolean;
}

declare global {
  interface Window {
    _contentSizeObserver?: ResizeObserver;
  }
}

class ContentSizeObserver {
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastHeight: number = 0;
  private options: {
    containerSelector: string;
    onSizeChanged: (height: number) => void;
    notificationDelay: number;
    observeMediaElements: boolean;
  };
  private mediaElements: Set<HTMLElement> = new Set();
  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;
  private initializeRetryTimeout: ReturnType<typeof setTimeout> | null = null;
  private mediaElementListeners: Map<HTMLElement, Array<() => void>> = new Map();

  constructor(options: ContentSizeObserverOptions = {}) {
    this.options = {
      containerSelector: options.containerSelector || ".editor-container",
      onSizeChanged: options.onSizeChanged || this.defaultSizeChangedHandler,
      notificationDelay: options.notificationDelay ?? 200,
      observeMediaElements: options.observeMediaElements ?? true,
    };
  }

  /**
   * Default handler that notifies Flutter via callHandler
   */
  private defaultSizeChangedHandler = (height: number): void => {
    void callNative(CallbackHandlerStrings.onContentSizeChange, height.toString());
  };

  /**
   * Notifies about size change with debouncing
   */
  private notifySizeChanged(height: number): void {
    if (height === this.lastHeight || height <= 0) {
      return;
    }

    this.lastHeight = height;

    // Clear any pending notification
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    if (this.options.notificationDelay > 0) {
      this.notificationTimeout = setTimeout(() => {
        this.options.onSizeChanged(height);
        this.notificationTimeout = null;
      }, this.options.notificationDelay);
    } else {
      this.options.onSizeChanged(height);
    }
  }

  /**
   * Sets up event listeners for media elements
   */
  private setupMediaListeners(container: HTMLElement, newElements?: HTMLElement[]): void {
    const mediaSelectors = ["video", "img", "iframe"];
    const mediaElements = newElements || container.querySelectorAll<HTMLElement>(mediaSelectors.join(", "));

    mediaElements.forEach((element) => {
      // Skip if listener already added
      if (this.mediaElements.has(element)) {
        return;
      }

      this.mediaElements.add(element);

      // Listen for load event
      const handleLoad = () => {
        if (!this.container) return;
        setTimeout(() => {
          const height = this.container!.clientHeight;
          this.notifySizeChanged(height);
        }, this.options.notificationDelay);
      };

      const cleanupFunctions: Array<() => void> = [];

      const loadHandler = () => {
        handleLoad();
        // Clean up after firing
        cleanupFunctions.forEach((cleanup) => cleanup());
        this.mediaElementListeners.delete(element);
      };

      element.addEventListener("load", loadHandler, { once: true });
      cleanupFunctions.push(() => element.removeEventListener("load", loadHandler));

      // For videos, also listen for loadedmetadata
      if (element.tagName === "VIDEO") {
        const metadataHandler = loadHandler;
        const dataHandler = loadHandler;
        element.addEventListener("loadedmetadata", metadataHandler, { once: true });
        element.addEventListener("loadeddata", dataHandler, { once: true });
        cleanupFunctions.push(
          () => element.removeEventListener("loadedmetadata", metadataHandler),
          () => element.removeEventListener("loadeddata", dataHandler)
        );
      }

      // For images, also listen for loadend
      if (element.tagName === "IMG") {
        const loadEndHandler = loadHandler;
        element.addEventListener("loadend", loadEndHandler, { once: true });
        cleanupFunctions.push(() => element.removeEventListener("loadend", loadEndHandler));
      }

      this.mediaElementListeners.set(element, cleanupFunctions);
    });
  }

  /**
   * Removes listeners for media elements that are no longer in the DOM
   */
  private cleanupRemovedMediaElements(container: HTMLElement): void {
    const currentElements = new Set(Array.from(container.querySelectorAll<HTMLElement>("video, img, iframe")));

    // Remove elements that are no longer in the DOM
    for (const element of this.mediaElements) {
      if (!currentElements.has(element) && !container.contains(element)) {
        // Clean up listeners
        const cleanupFunctions = this.mediaElementListeners.get(element);
        if (cleanupFunctions) {
          cleanupFunctions.forEach((cleanup) => cleanup());
          this.mediaElementListeners.delete(element);
        }
        this.mediaElements.delete(element);
      }
    }
  }

  /**
   * Sets up the ResizeObserver for the container
   */
  private setupResizeObserver(container: HTMLElement): void {
    // Clean up existing observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // Store reference globally for cleanup
    if (window._contentSizeObserver) {
      window._contentSizeObserver.disconnect();
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        this.notifySizeChanged(height);
      }
    });

    this.resizeObserver.observe(container);
    window._contentSizeObserver = this.resizeObserver;
  }

  /**
   * Initializes the observer with the container element
   */
  public initialize(container?: HTMLElement | null): void {
    // Clear any pending retry
    if (this.initializeRetryTimeout) {
      clearTimeout(this.initializeRetryTimeout);
      this.initializeRetryTimeout = null;
    }

    const targetContainer = container || document.querySelector<HTMLElement>(this.options.containerSelector);

    if (!targetContainer) {
      console.warn(
        `ContentSizeObserver: Container not found with selector "${this.options.containerSelector}". Retrying in 500ms...`
      );
      this.initializeRetryTimeout = setTimeout(() => {
        this.initializeRetryTimeout = null;
        this.initialize();
      }, 500);
      return;
    }

    this.container = targetContainer;
    this.lastHeight = targetContainer.clientHeight;

    // Set up ResizeObserver - this will catch all size changes including when media loads
    this.setupResizeObserver(targetContainer);

    // Set up media element listeners if enabled
    // Note: We only set up listeners for existing elements since they're already in the DOM.
    // ResizeObserver will handle size changes when they load.
    if (this.options.observeMediaElements) {
      this.setupMediaListeners(targetContainer);
    }

    // Initial notification
    this.notifySizeChanged(this.lastHeight);
  }

  /**
   * Manually triggers a size check and notification
   */
  public checkSize(): void {
    if (!this.container) {
      return;
    }

    const height = this.container.clientHeight;
    this.notifySizeChanged(height);
  }

  /**
   * Cleans up all observers and listeners
   */
  public disconnect(): void {
    // Clear pending timeouts
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }

    if (this.initializeRetryTimeout) {
      clearTimeout(this.initializeRetryTimeout);
      this.initializeRetryTimeout = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (window._contentSizeObserver) {
      window._contentSizeObserver.disconnect();
      delete window._contentSizeObserver;
    }

    // Clean up all media element listeners
    for (const [, cleanupFunctions] of this.mediaElementListeners.entries()) {
      cleanupFunctions.forEach((cleanup) => cleanup());
    }
    this.mediaElementListeners.clear();
    this.mediaElements.clear();
    this.container = null;
    this.lastHeight = 0;
  }

  /**
   * Gets the current content height
   */
  public getCurrentHeight(): number {
    return this.container?.clientHeight ?? 0;
  }
}

// Export singleton instance and class
let contentSizeObserverInstance: ContentSizeObserver | null = null;

/**
 * Initializes the content size observer
 */
export function initializeContentSizeObserver(options?: ContentSizeObserverOptions): ContentSizeObserver {
  if (contentSizeObserverInstance) {
    contentSizeObserverInstance.disconnect();
  }

  contentSizeObserverInstance = new ContentSizeObserver(options);
  contentSizeObserverInstance.initialize();

  return contentSizeObserverInstance;
}

/**
 * Gets the current observer instance
 */
export function getContentSizeObserver(): ContentSizeObserver | null {
  return contentSizeObserverInstance;
}

/**
 * Manually triggers a size check
 */
export function checkContentSize(): void {
  contentSizeObserverInstance?.checkSize();
}

/**
 * Gets the current content height
 */
export function getContentHeight(): number {
  return contentSizeObserverInstance?.getCurrentHeight() ?? 0;
}

/**
 * Cleans up the observer
 */
export function disconnectContentSizeObserver(): void {
  contentSizeObserverInstance?.disconnect();
  contentSizeObserverInstance = null;
}

// Default export
export default ContentSizeObserver;
