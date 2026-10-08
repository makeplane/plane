/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";

const useIsInIframe = () => {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const checkIfInIframe = () => {
      setIsInIframe(window.self !== window.top);
    };

    checkIfInIframe();
  }, []);

  return isInIframe;
};

export default useIsInIframe;
