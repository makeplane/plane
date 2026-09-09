/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Button } from "@makeplane/propel/components/button";
import type { ButtonVariant } from "@makeplane/propel/components/button";
import type { TButtonVariant } from "./types";

/** Maps the legacy empty-state action variants onto @makeplane/propel Button variants. */
export const getButtonVariant = (variant?: TButtonVariant): ButtonVariant => {
  switch (variant) {
    case "error-fill":
      return "danger";
    case "error-outline":
      return "danger-outline";
    case "secondary":
      return "secondary";
    case "tertiary":
      return "tertiary";
    case "ghost":
    case "link":
      return "ghost";
    case "primary":
    default:
      return "primary";
  }
};

export { Button };
