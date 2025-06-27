import { TPage } from "@plane/types";
import * as Y from "yjs";

export type TAdditionalDocumentTypes = null;

export interface ActionCondition {
  name: string;
  check: (page: TPage, isInDocument: boolean, context?: any) => boolean;
}

export interface DocumentAction {
  name: string;
  execute: (
    xmlFragment: Y.XmlFragment,
    page: TPage,
    context: {
      childNodesMap?: Map<string, Y.XmlElement>;
      embeddedIDs?: Set<string>;
      [key: string]: any;
    }
  ) => void;
}

export interface ActionRule {
  condition: string;
  action: string;
  priority: number;
}
