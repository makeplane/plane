/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { NodeType, Schema } from "@tiptap/pm/model";

export function getTableNodeTypes(schema: Schema): { [key: string]: NodeType } {
  if (schema.cached.tableNodeTypes) {
    return schema.cached.tableNodeTypes;
  }

  const roles: { [key: string]: NodeType } = {};

  Object.keys(schema.nodes).forEach((type) => {
    const nodeType = schema.nodes[type];

    if (nodeType.spec.tableRole) {
      roles[nodeType.spec.tableRole] = nodeType;
    }
  });

  schema.cached.tableNodeTypes = roles;

  return roles;
}
