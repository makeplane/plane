import { TPage } from "@plane/types";
import * as Y from "yjs";
import { ConditionRegistry } from "./registries/condition-registry";
import { ActionRegistry } from "./registries/action-registry";
import { RuleRegistry } from "./registries/rule-registry";
import { findAllElementsRecursive } from "@/core/utilities/xml-tree-utils";
import "./rules/standard-rule";
import "./actions/standard-action";
import "./conditions/standard-condition";

export class DocumentProcessor {
  static process(
    xmlFragment: Y.XmlFragment,
    subPages: TPage[],
    options: {
      targetNodeId?: string;
      componentType?: string;
      [key: string]: any;
    } = {}
  ): void {
    // Build a set of embedded IDs and create a map of id to node
    const embeddedIDs = new Set<string>();
    const childNodesMap = new Map<string, Y.XmlElement>();
    const componentType = options.componentType || "pageEmbedComponent";

    // Also track IDs of moved pages that are already in the document as links
    const embeddedMovedIds = new Set<string>();

    // Find all nodes of the specified component type in the entire document tree
    const pageEmbedNodes = findAllElementsRecursive(xmlFragment, componentType, "entity_identifier", "*");

    // Add all found embed nodes to our maps
    pageEmbedNodes.forEach(({ node }) => {
      const id = node.getAttribute("entity_identifier");
      if (typeof id === "string") {
        embeddedIDs.add(id);
        childNodesMap.set(id, node);
      }
    });

    // Create a set of backend page IDs for later use
    const backendPageIds = new Set<string>();
    (subPages || []).forEach((page) => {
      if (page.id) backendPageIds.add(page.id);
    });

    // Process each backend page
    (subPages || []).forEach((page) => {
      if (!page.id) return;

      const isInDocument = embeddedIDs.has(page.id);
      const context = {
        childNodesMap,
        embeddedIDs,
        embeddedMovedIds,
        backendPageIds,
        targetId: options.targetNodeId,
        ...options,
      };

      for (const rule of RuleRegistry.getAll()) {
        const condition = ConditionRegistry.get(rule.condition);
        const action = ActionRegistry.get(rule.action);

        if (condition && action && condition.check(page, isInDocument, context)) {
          action.execute(xmlFragment, page, context);
          break;
        }
      }
    });

    const removeAction = ActionRegistry.get("removeNode");
    if (removeAction) {
      const embeddedIdsNotInBackend = Array.from(embeddedIDs).filter((id) => !backendPageIds.has(id));

      if (embeddedIdsNotInBackend.length > 0) {
        embeddedIdsNotInBackend.forEach((id) => {
          const dummyPage = { id } as TPage;
          removeAction.execute(xmlFragment, dummyPage, { embeddedIDs });
        });
      }
    }
  }
}
