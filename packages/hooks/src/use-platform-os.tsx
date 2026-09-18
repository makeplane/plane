/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";

export const usePlatformOS = () => {
  const [platformData, setPlatformData] = useState({
    isMobile: false,
    platform: "",
  });

  useEffect(() => {
    const detectPlatform = () => {
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

      setPlatformData({ isMobile, platform });
    };

    detectPlatform();
  }, []);

  return platformData;
};
