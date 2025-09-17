import { TPage } from "@plane/types";
import { HocusPocusServerContext } from "@/core/types/common";

/**
 * Parameters for document fetch operations
 */
export interface DocumentFetchParams {
  context: HocusPocusServerContext;
  pageId: string;
}

/**
 * Parameters for document store operations
 */
export interface DocumentStoreParams {
  context: HocusPocusServerContext;
  pageId: string;
  state: Uint8Array;
  title: string;
}

export interface DocumentTitleFetchParams {
  pageId: string;
  context: HocusPocusServerContext;
}

export interface DocumentTitleUpdateParams {
  context: HocusPocusServerContext;
  pageId: string;
  title: string;
  abortSignal?: AbortSignal;
}

export interface DocumentSubPagesFetchParams {
  pageId: string;
  context: HocusPocusServerContext;
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
  fetchTitle?: (params: DocumentTitleFetchParams) => Promise<string | undefined>;

  /**
   * Update title
   */
  updateTitle?: (params: DocumentTitleUpdateParams) => Promise<void>;

  fetchSubPages?: (params: DocumentSubPagesFetchParams) => Promise<TPage[] | undefined>;
}

/**
 * Handler selector function type - determines if a handler should be used based on context
 */
export type HandlerSelector = (context: Partial<HocusPocusServerContext>) => boolean;

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
