import { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";
// plane imports
import { createRealtimeEvent } from "@plane/editor";
import type { TPage } from "@plane/types";
// core
import { getDocumentHandler } from "@/core/handlers/page-handlers";
import { HocusPocusServerContext } from "@/core/types/common";
import { findAllElementsRecursive } from "@/core/utilities/xml-tree-utils";
// local imports
import { ActionRegistry } from "./registries/action-registry";
import { ConditionRegistry } from "./registries/condition-registry";
import { RuleRegistry } from "./registries/rule-registry";
import "./rules/standard-rule";
import "./actions/standard-action";
import "./conditions/standard-condition";
import { broadcastMessageToPage } from "./utils/broadcast-message";

type TProcesArgs = {
  xmlFragment: Y.XmlFragment;
  subPages: TPage[];
  options: {
    targetNodeId?: string;
    componentType?: string;
    [key: string]: unknown;
  };
  context: HocusPocusServerContext;
  documentName: string;
  instance: Hocuspocus | null;
};

export class DocumentProcessor {
  static process(args: TProcesArgs): void {
    const { xmlFragment, subPages, options, context, instance, documentName } = args;
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

      embeddedIdsNotInBackend.forEach((id) => {
        const dummyPage = { id } as TPage;
        removeAction.execute(xmlFragment, dummyPage, { embeddedIDs });
      });
    }

    const pageEmbedNodesPostProcessing = findAllElementsRecursive(
      xmlFragment,
      componentType,
      "entity_identifier",
      "*"
    ).map((p) => p.node);
    const contentPageEmbeds = pageEmbedNodesPostProcessing.map((node, index) => ({
      id: node.getAttribute("entity_identifier"),
      index,
    }));
    const existingSubPages = Array.from(backendPageIds).map((pageId, index) => ({
      id: pageId,
      index,
    }));

    const isChanged = existingSubPages.some((subPage) => {
      const contentPageEmbed = contentPageEmbeds.find((contentPageEmbed) => contentPageEmbed.id === subPage.id);
      return contentPageEmbed?.index !== subPage.index;
    });
    if (isChanged) {
      const documentHandler = getDocumentHandler(context.documentType);
      contentPageEmbeds.forEach((contentPageEmbed) => {
        if (contentPageEmbed.id && documentHandler && documentHandler.updatePageProperties) {
          const updatedSortOrder = (contentPageEmbed.index + 1) * 1000;
          documentHandler
            .updatePageProperties({
              context,
              pageId: contentPageEmbed.id,
              data: { sort_order: updatedSortOrder },
            })
            .then(() => {
              if (instance && contentPageEmbed.id) {
                const event = createRealtimeEvent({
                  user_id: context.userId,
                  workspace_slug: context.workspaceSlug as string,
                  action: "property_updated",
                  page_id: contentPageEmbed.id,
                  data: {
                    sort_order: updatedSortOrder,
                  },
                  descendants_ids: [],
                });
                broadcastMessageToPage(instance, documentName, event);
              }
            });
        }
      });
    }
  }
}
