import { type Attrs } from "@tiptap/pm/model";
import { type Transaction } from "@tiptap/pm/state";

export function setNodeAttributes(tr: Transaction, pos: number, oldAttrs: Attrs, newAttrs: Attrs): boolean {
  let needUpdate = false;
  for (const key of Object.keys(newAttrs)) {
    if (newAttrs[key] !== oldAttrs[key]) {
      tr.setNodeAttribute(pos, key, newAttrs[key]);
      needUpdate = true;
    }
  }
  return needUpdate;
}
