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

import * as acorn from "acorn";
import { tsPlugin } from "@sveltejs/acorn-typescript";

export const tsParser = acorn.Parser.extend(tsPlugin());

// Extended AST node type that covers properties used across different node kinds.
// acorn.Node only has type/start/end, but walker callbacks receive richer nodes.
export interface ASTNode {
  type: string;
  start: number;
  end: number;
  name?: string;
  value?: unknown;
  callee?: ASTNode;
  object?: ASTNode;
  property?: ASTNode;
  arguments?: ASTNode[];
  test?: ASTNode | null;
  computed?: boolean;
}
