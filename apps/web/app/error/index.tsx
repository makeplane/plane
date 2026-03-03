/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// layouts
import { DevErrorComponent } from "./dev";
import { ProdErrorComponent } from "./prod";

export function CustomErrorComponent({ error }: { error: unknown }) {
  // router
  const router = useAppRouter();

  const handleGoHome = () => router.push("/");
  const handleReload = () => window.location.reload();

  if (import.meta.env.DEV) {
    return <DevErrorComponent error={error} onGoHome={handleGoHome} onReload={handleReload} />;
  }

  return <ProdErrorComponent onGoHome={handleGoHome} />;
}
