/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { initPromise } from "@plane/i18n";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Initialize i18n before hydrating (the remix-i18next pattern for React
// Router: await init, then hydrateRoot). The server renders with an
// initialized instance; hydrating before the client instance is ready would
// make the first client render diverge from the server HTML, and React 19
// leaves server DOM it could not adopt in place instead of clearing it.
void initPromise
  .catch(() => {})
  .then(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      );
    });
  });
