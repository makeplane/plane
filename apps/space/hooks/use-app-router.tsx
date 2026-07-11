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
      push: (to: string) => navigate(ensureTrailingSlash(to)),
      replace: (to: string) => navigate(ensureTrailingSlash(to), { replace: true }),
      back: () => navigate(-1),
    }),
    [navigate]
  );
};
