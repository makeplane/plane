import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as Y from "yjs";
import { Controller, Post } from "@plane/decorators";
import {
  BroadcastPayloadUnion,
  CommonRealtimeFields,
  createRealtimeEvent,
  type TDocumentEventsClient,
} from "@plane/editor/lib";
// decorators
// utilities
import { serverAgentManager } from "@/core/agents/server-agent";
import { manualLogger } from "@/core/helpers/logger";
import { findAllElementsRecursive, insertNodeAfter, deleteNode } from "@/core/utilities/xml-tree-utils";
// logger
// agents
// broadcast
import { broadcastMessageToPage } from "@/ee/lib/utils/broadcast-message";

// (Optional) additional types used in your controller
interface ConnectionContext {
  workspaceSlug: string;
}

// If needed, you can also define a metadata type.
// Here, we rely on the output of createRealtimeEvent.
export interface CompleteMetadata extends CommonRealtimeFields {
  action: TDocumentEventsClient;
  data: Record<string, any>;
}

@Controller("/broadcast")
export class BroadcastController {
  @Post("/")
  async handleBroadcast(req: Request<any, any, BroadcastPayloadUnion>, res: Response) {
    try {
      const payload = req.body;
      // Destructure common properties
      const { action, descendants_ids, page_id, parent_id, data, workspace_slug, user_id } = payload;

      // Add user_id to data
      data.user_id = user_id;

      // Create a complete metadata object using our helper
      const completeMetadata = createRealtimeEvent({
        action,
        page_id,
        parent_id,
        descendants_ids,
        data,
        workspace_slug: workspace_slug || "",
        user_id: user_id || "",
      });

      // Collect all affected page IDs
      const affectedPageIds = this.collectAffectedPageIds(payload);

      // Broadcast to all affected pages
      this.broadcastToAffectedPages(affectedPageIds, completeMetadata);

      // Create a context object for later operations
      const connectionContext: ConnectionContext = {
        workspaceSlug: workspace_slug || "",
      };

      res.status(200).json({ success: true });

      // Send response immediately for moved_internally to prevent hanging
      if (action === "moved_internally" && page_id) {
        this.handleMovedInternally(payload, connectionContext);
        return;
      }

      // Handle specific actions
      if (action === "duplicated" && parent_id && page_id) {
        this.handleDuplicated(payload, connectionContext);
      } else if (action === "deleted" && parent_id && page_id) {
        this.handleDeleted(payload, connectionContext);
      } else if (action === "sub_page") {
        this.handleSubPage(payload, connectionContext);
      }
    } catch (error) {
      manualLogger.error(error, "Error in broadcast handler:");
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  private collectAffectedPageIds(payload: BroadcastPayloadUnion): string[] {
    const { page_id, parent_id, descendants_ids, action, data } = payload;
    const affectedPageIds = [...(page_id ? [page_id] : []), ...(parent_id ? [parent_id] : []), ...descendants_ids];

    // Add special IDs for moved_internally action
    if (action === "moved_internally") {
      if (data?.new_parent_id) affectedPageIds.push(data.new_parent_id);
      if (data?.old_parent_id) affectedPageIds.push(data.old_parent_id);
    }

    if (action === "restored") {
      if (data?.deleted_page_ids) affectedPageIds.push(...data.deleted_page_ids);
    }

    return affectedPageIds.filter(Boolean);
  }

  private broadcastToAffectedPages(pageIds: string[], metadata: CompleteMetadata): void {
    pageIds.forEach((pageId) => {
      try {
        broadcastMessageToPage(serverAgentManager, pageId, metadata);
      } catch (error) {
        manualLogger.error(error, `Error broadcasting to page ${pageId}:`);
      }
    });
  }

  private handleMovedInternally(payload: BroadcastPayloadUnion, context: ConnectionContext): void {
    if (payload.action !== "moved_internally" || !payload.page_id) return;

    const { page_id, workspace_slug, data } = payload;
    const old_parent_id = data?.old_parent_id || null;
    const new_parent_id = data?.new_parent_id || null;

    // Handle old parent (remove page embed)
    if (old_parent_id) {
      setTimeout(() => {
        this.removePageEmbedFromParent(old_parent_id, page_id, context);
      }, 100);
    }

    // Handle new parent (add page embed)
    if (new_parent_id) {
      setTimeout(() => {
        this.addPageEmbedToParent(new_parent_id, page_id, workspace_slug || "", context);
      }, 500);
    }
  }

  private handleDuplicated(payload: BroadcastPayloadUnion, context: ConnectionContext): void {
    if (payload.action !== "duplicated" || !payload.parent_id || !payload.page_id) return;
    if (!payload.data || !payload.data.new_page_id) return;

    const { parent_id, page_id, data, workspace_slug } = payload;

    serverAgentManager
      .executeTransaction(
        parent_id,
        (doc) => {
          const xmlFragment = doc.getXmlFragment("default");
          const matchingEmbeds = findAllElementsRecursive(
            xmlFragment,
            "pageEmbedComponent",
            "entity_identifier",
            page_id
          );

          if (matchingEmbeds.length > 0) {
            matchingEmbeds.forEach(({ parent, indexInParent }) => {
              const newPageEmbedNode = new Y.XmlElement("pageEmbedComponent");
              newPageEmbedNode.setAttribute("entity_identifier", data.new_page_id as string);
              newPageEmbedNode.setAttribute("entity_name", "sub_page");
              newPageEmbedNode.setAttribute("id", uuidv4());
              newPageEmbedNode.setAttribute("workspace_identifier", workspace_slug || "");
              insertNodeAfter(parent, indexInParent, newPageEmbedNode);
            });
          }
        },
        { workspaceSlug: context.workspaceSlug || "" }
      )
      .catch((error) => {
        manualLogger.error(error, "Error handling duplicated action:");
      });
  }

  private handleSubPage(payload: BroadcastPayloadUnion, context: ConnectionContext): void {
    if (payload.action !== "sub_page" || !payload.parent_id || !payload.page_id) return;

    const { parent_id, page_id } = payload;

    this.addPageEmbedToParent(parent_id, page_id, context.workspaceSlug || "", context);
  }

  private handleDeleted(payload: BroadcastPayloadUnion, context: ConnectionContext): void {
    if (payload.action !== "deleted" || !payload.parent_id || !payload.page_id) return;

    const { parent_id, page_id } = payload;

    serverAgentManager
      .executeTransaction(
        parent_id,
        (doc) => {
          const xmlFragment = doc.getXmlFragment("default");
          const matchingEmbeds = findAllElementsRecursive(
            xmlFragment,
            "pageEmbedComponent",
            "entity_identifier",
            page_id
          );

          if (matchingEmbeds.length > 0) {
            for (let i = matchingEmbeds.length - 1; i >= 0; i--) {
              const { parent, indexInParent } = matchingEmbeds[i];
              deleteNode(parent, indexInParent);
            }
          }
        },
        { workspaceSlug: context.workspaceSlug || "" }
      )
      .catch((error) => {
        manualLogger.error(error, "Error handling deleted action:");
      });
  }

  private removePageEmbedFromParent(parentId: string, pageId: string, context: ConnectionContext): void {
    serverAgentManager
      .executeTransaction(
        parentId,
        (doc) => {
          const xmlFragment = doc.getXmlFragment("default");
          const matchingEmbeds = findAllElementsRecursive(
            xmlFragment,
            "pageEmbedComponent",
            "entity_identifier",
            pageId
          );

          if (matchingEmbeds.length > 0) {
            for (let i = matchingEmbeds.length - 1; i >= 0; i--) {
              const { parent, indexInParent } = matchingEmbeds[i];
              deleteNode(parent, indexInParent);
            }
          }
        },
        { workspaceSlug: context.workspaceSlug || "" }
      )
      .catch((err) => {
        console.error("Error removing from old parent:", err);
      });
  }

  private addPageEmbedToParent(
    parentId: string,
    pageId: string,
    workspaceSlug: string,
    context: ConnectionContext
  ): void {
    serverAgentManager
      .executeTransaction(
        parentId,
        (doc) => {
          const xmlFragment = doc.getXmlFragment("default");
          const newPageEmbedNode = new Y.XmlElement("pageEmbedComponent");
          newPageEmbedNode.setAttribute("entity_identifier", pageId);
          newPageEmbedNode.setAttribute("entity_name", "sub_page");
          newPageEmbedNode.setAttribute("id", uuidv4());
          newPageEmbedNode.setAttribute("workspace_identifier", workspaceSlug);
          xmlFragment.push([newPageEmbedNode]);
        },
        {
          documentType: "workspace_page",
          workspaceSlug: context.workspaceSlug || "",
        }
      )
      .catch((err) => {
        console.error("Error adding to new parent:", err);
      });
  }
}
