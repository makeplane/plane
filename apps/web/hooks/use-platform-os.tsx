/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type PlatformOS = {
  isMobile: boolean;
  platform: string;
};

const detectPlatformOS = (): PlatformOS => {
  if (typeof window === "undefined") {
    return { isMobile: false, platform: "" };
  }

  const userAgent = window.navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  let platform = "";

  if (!isMobile) {
    if (userAgent.indexOf("Win") !== -1) {
      platform = "Windows";
    } else if (userAgent.indexOf("Mac") !== -1) {
      platform = "MacOS";
    } else if (userAgent.indexOf("Linux") !== -1) {
      platform = "Linux";
    } else {
      platform = "Unknown";
    }
  }
  return { isMobile, platform };
};

// device/OS can't change mid-session, so detect once at module load and return a stable reference
const PLATFORM_OS: PlatformOS = Object.freeze(detectPlatformOS());

export const usePlatformOS = () => PLATFORM_OS;
