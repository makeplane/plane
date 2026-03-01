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

      if (isMobile && userAgent.indexOf("Android") !== -1) {
        platform = "Android";
      } else if (userAgent.indexOf("Win") !== -1) {
        platform = "Windows";
      } else if (userAgent.indexOf("Mac") !== -1) {
        platform = "MacOS";
      } else if (userAgent.indexOf("Linux") !== -1) {
        platform = "Linux";
      } else {
        platform = "Unknown";
      }

      setPlatformData({ isMobile, platform });
    };

    detectPlatform();
  }, []);

  return platformData;
};
