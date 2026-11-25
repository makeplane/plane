/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// components
import { ProductBoardRoot } from "@/components/product-board/root";
// local imports
import type { Route } from "./+types/page";

export default function ProductBoardPage({ params }: Route.ComponentProps) {
  return <ProductBoardRoot workspaceSlug={params.workspaceSlug} />;
}
