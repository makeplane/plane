/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { ProductTypePage } from "@/components/products/type-page";
// local imports
import type { Route } from "./+types/page";

export default function WorkspaceProductTypePage({ params }: Route.ComponentProps) {
  return <ProductTypePage workspaceSlug={params.workspaceSlug} productTypeId={params.productTypeId} />;
}
