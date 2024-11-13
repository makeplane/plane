import { type NodeType } from 'prosemirror-model'

import { getListType } from './get-list-type'

/** @public */
export function isListType(type: NodeType): boolean {
  return getListType(type.schema) === type
}
