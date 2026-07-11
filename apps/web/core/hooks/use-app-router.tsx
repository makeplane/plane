/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router";
// plane imports
import { ensureTrailingSlash } from "@plane/utils";

export type TAppRouter = {
  push: (to: string) => void;
  replace: (to: string) => void;
  back: () => void;
};

export const useAppRouter = (): TAppRouter => {
  const navigate = useNavigate();

  return useMemo(
    () => ({
      // Navigation is deferred a tick because callers such as the authentication wrapper
      // redirect from inside the render phase, which React forbids doing synchronously.
      push: (to: string) => {
        setTimeout(() => navigate(ensureTrailingSlash(to)), 0);
      },
      replace: (to: string) => {
        setTimeout(() => navigate(ensureTrailingSlash(to), { replace: true }), 0);
      },
      back: () => {
        setTimeout(() => navigate(-1), 0);
      },
    }),
    [navigate]
  );
};
