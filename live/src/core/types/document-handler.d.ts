import { HocusPocusServerContext, TDocumentTypes } from "@/core/types/common";

/**
 * Parameters for document fetch operations
 */
export interface DocumentFetchParams {
  context: HocusPocusServerContext;
  pageId: string;
  params: URLSearchParams;
}

/**
 * Parameters for document store operations
 */
export interface DocumentStoreParams {
  context: HocusPocusServerContext;
  pageId: string;
  state: any;
  params: URLSearchParams;
}

/**
 * Interface defining a document handler
 */
export interface DocumentHandler {
  /**
   * Fetch a document
   */
  fetch: (params: DocumentFetchParams) => Promise<any>;

  /**
   * Store a document
   */
  store: (params: DocumentStoreParams) => Promise<void>;

  /**
   * Fetch title
   */
  fetchTitle: (params: { workspaceSlug: string; projectId: string; pageId: string; cookie: string }) => Promise<string>;

  /**
   * Update title
   */
  updateTitle?: (
    workspaceSlug: string,
    projectId: string,
    pageId: string,
    title: string,
    cookie: string
  ) => Promise<void>;
}

/**
 * Handler context interface - extend this to add new criteria for handler selection
 */
export interface HandlerContext {
  documentType?: TDocumentTypes;
  agentId?: string;
}

/**
 * Handler selector function type - determines if a handler should be used based on context
 */
export type HandlerSelector = (context: HandlerContext) => boolean;

/**
 * Handler definition combining a selector and implementation
 */
export interface HandlerDefinition {
  selector: HandlerSelector;
  handler: DocumentHandler;
  priority: number; // Higher number means higher priority
}

/**
 * Type for a handler registration function
 */
export type RegisterHandler = (definition: HandlerDefinition) => void;
