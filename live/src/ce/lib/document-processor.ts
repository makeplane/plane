import * as Y from "yjs";
import { HocusPocusServerContext } from "@/core/types/common";

export class DocumentProcessor {
  static async process(
    xmlFragment: Y.XmlFragment,
    pageId: string,
    context: HocusPocusServerContext,
    options: {
      targetNodeId?: string;
      componentType?: string;
      [key: string]: any;
    } = {}
  ): Promise<void> {}
}
