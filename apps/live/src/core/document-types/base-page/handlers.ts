import {
  getAllDocumentFormatsFromDocumentEditorBinaryData,
  getBinaryDataFromDocumentEditorHTMLString,
} from "@plane/editor/lib";
import { logger } from "@plane/logger";
import { TPage } from "@plane/types";
import { handlerFactory } from "@/core/handlers/page-handlers/handler-factory";
import { BasePageService } from "@/core/services/base-page.service";
import { HocusPocusServerContext } from "@/core/types/common";
import { DocumentHandler, HandlerDefinition } from "@/core/types/document-handler";

/**
 * Base class for page handlers with factory integration
 */
export abstract class BasePageHandler<TService extends BasePageService, TConfig extends Record<string, any>> {
  /**
   * The document type identifier
   */
  protected abstract documentType: string;

  constructor(protected service: TService) {}

  /**
   * Abstract method to get config from context
   */
  protected abstract getConfig(context: HocusPocusServerContext): TConfig;

  /**
   * Fetches the binary description data for a page
   */
  public async fetchPageDescriptionBinary({
    pageId,
    context,
  }: {
    pageId: string;
    context: HocusPocusServerContext;
  }): Promise<Uint8Array | undefined> {
    const { cookie } = context;
    const config = this.getConfig(context);

    if (!pageId) return;

    const response = await this.service.fetchDescriptionBinary({
      pageId,
      cookie,
      config,
    });
    const binaryData = new Uint8Array(response);

    if (binaryData.byteLength === 0) {
      const binary = await this.transformHTMLToBinary(config, pageId, cookie);
      if (binary) {
        return binary;
      }
    }

    return binaryData;
  }

  /**
   * Updates the description of a page
   */
  public async updatePageDescription({
    pageId,
    state: updatedDescription,
    title,
    context,
  }: {
    pageId: string;
    state: Uint8Array;
    title: string;
    context: HocusPocusServerContext;
  }): Promise<void> {
    if (!(updatedDescription instanceof Uint8Array)) {
      throw new Error("Invalid updatedDescription: must be an instance of Uint8Array");
    }

    const { cookie } = context;
    const config = this.getConfig(context);

    if (!pageId) return;

    const { contentBinaryEncoded, contentHTML, contentJSON } = getAllDocumentFormatsFromDocumentEditorBinaryData(
      updatedDescription,
      true
    );
    const payload = {
      description_binary: contentBinaryEncoded,
      description_html: contentHTML,
      description: contentJSON,
      name: title,
    };

    await this.service.updateDescription({
      config,
      pageId,
      data: payload,
      cookie,
    });
  }

  /**
   * Fetches the title of a page
   */
  public async fetchPageTitle({
    context,
    pageId,
  }: {
    pageId: string;
    context: HocusPocusServerContext;
  }): Promise<string | undefined> {
    const { cookie } = context;
    const config = this.getConfig(context);

    if (!pageId) return;

    try {
      const pageDetails = await this.service.fetchDetails({
        config,
        pageId,
        cookie,
      });
      return pageDetails.name;
    } catch (error) {
      logger.error("Error while fetching page title", error);
      throw error;
    }
  }

  /**
   * Updates the title of a page
   */
  public async updatePageTitle({
    context,
    pageId,
    title,
    abortSignal,
  }: {
    pageId: string;
    title: string;
    abortSignal?: AbortSignal;
    context: HocusPocusServerContext;
  }): Promise<void> {
    const { cookie } = context;
    const config = this.getConfig(context);

    if (!pageId) return;

    const payload = {
      name: title,
    };

    await this.service.updateTitle({
      config,
      pageId,
      data: payload,
      cookie,
      abortSignal,
    });
  }

  /**
   * Fetches sub-page details
   */
  public async fetchPageSubPageDetails({
    context,
    pageId,
  }: {
    pageId: string;
    context: HocusPocusServerContext;
  }): Promise<TPage[] | undefined> {
    const { cookie } = context;
    const config = this.getConfig(context);

    if (!pageId) return;

    try {
      const response = await this.service.fetchSubPageDetails({
        config,
        pageId,
        cookie,
      });
      return response;
    } catch (error) {
      logger.error("Fetch error:", error);
      throw error;
    }
  }

  /**
   * Transforms HTML to binary data
   */
  private async transformHTMLToBinary(
    config: TConfig,
    pageId: string,
    cookie: string
  ): Promise<Uint8Array | undefined> {
    try {
      const pageDetails = await this.service.fetchDetails({
        config,
        pageId,
        cookie,
      });

      const contentBinary = getBinaryDataFromDocumentEditorHTMLString(pageDetails.description_html ?? "<p></p>");
      return contentBinary;
    } catch (error) {
      logger.error("Error while transforming from HTML to Uint8Array", error);
      throw error;
    }
  }

  /**
   * Creates the handler definition
   */
  protected createHandlerDefinition(): HandlerDefinition {
    const handler: DocumentHandler = {
      fetch: this.fetchPageDescriptionBinary.bind(this),
      store: this.updatePageDescription.bind(this),
      fetchTitle: this.fetchPageTitle.bind(this),
      updateTitle: this.updatePageTitle.bind(this),
      fetchSubPages: this.fetchPageSubPageDetails.bind(this),
    };

    return {
      selector: (context: Partial<HocusPocusServerContext>) => context.documentType === this.documentType,
      handler,
      priority: 10, // Standard priority
    };
  }

  /**
   * Registers the handler with the handler factory
   */
  public register(): void {
    const definition = this.createHandlerDefinition();
    handlerFactory.register(definition);
  }
}
