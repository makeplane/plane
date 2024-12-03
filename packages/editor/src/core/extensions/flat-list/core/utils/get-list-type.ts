import { type NodeType, type Schema } from "@tiptap/pm/model";

import { flatListGroup } from "../schema/node-spec";

/** @internal */
export function getListType(schema: Schema, listTypeName: string = "list"): NodeType {
  const cacheKey = `PROSEMIRROR_FLAT_LIST_${listTypeName.toUpperCase()}_TYPE_NAME`;

  let name: string = schema.cached["PROSEMIRROR_FLAT_LIST_LIST_TYPE_NAME"];

  if (!name) {
    for (const type of Object.values(schema.nodes)) {
      if ((type.spec.group || "").split(" ").includes(flatListGroup)) {
        name = type.name;
        break;
      }
    }

    if (!name) {
      throw new TypeError("[prosemirror-flat-list] Unable to find a flat list type in the schema");
    }

    schema.cached["PROSEMIRROR_FLAT_LIST_LIST_TYPE_NAME"] = name;
  }

  return schema.nodes[name];
}
