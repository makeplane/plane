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

import { useEffect, useState } from "react";
import { Loader as Spinner } from "lucide-react";

const messages = [
  "We're creating your project",
  "Just tuning a few settings for you",
  "All set! Just a few seconds more",
];

export function ProjectCreateLoader() {
  const [loadingMessage, setLoadingMessage] = useState(messages[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < messages.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          currentIndex++;
          setLoadingMessage(messages[currentIndex]);
          setIsTransitioning(false);
        }, 300);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex items-center justify-center py-8">
      <div className="flex items-center gap-3 w-full justify-center">
        <Spinner className="size-5 animate-spin" />
        <div className="relative min-w-[200px] flex items-center">
          <p
            className={`text-16 font-medium text-tertiary transition-all duration-500 ease-in-out ${
              isTransitioning ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"
            }`}
          >
            {loadingMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
