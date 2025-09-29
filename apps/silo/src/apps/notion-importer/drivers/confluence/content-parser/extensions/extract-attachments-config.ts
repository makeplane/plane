import { HTMLElement } from "node-html-parser";
import { TConfluenceContentParserContext } from "@/apps/notion-importer/types";
import { CONFLUENCE_ATTACHMENT_SOURCE_SELECTOR } from "@/apps/notion-importer/utils/html-helpers";
import { ExtractBodyExtension } from "../../../common/content-parser";

export type TConfluenceAttachmentConfig = {
  fileName: string | undefined;
  href: string | undefined;
};

/*
 * This extension is used to extract out the attachment details at the bottom of the html
 * page that is passed. Essentially this extension is created in order to support drawio and
 * other embed imports, because fileName is the thing that connects both the href of the real
 * file and the block of the emebd.
 */
export class ConfluenceExtractAttachmentConfigExtension extends ExtractBodyExtension {
  sourceSelector = CONFLUENCE_ATTACHMENT_SOURCE_SELECTOR;

  /**
   * Extracts the attachment config from the attachment node
   * @param node
   * @returns The attachment config
   */
  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const attachments = node.querySelectorAll(this.config.selector);

    const attachmentConfig = attachments[0].childNodes
      .map((attachment) => this.extractAttachmentConfig(attachment as HTMLElement))
      .filter((attachment) => attachment !== undefined);

    this.config.context?.set(TConfluenceContentParserContext.ATTACHMENTS, JSON.stringify(attachmentConfig));
    return node;
  }

  /**
   * Extracts the attachment config from the attachment node
   * @param attachment
   * @returns The attachment config
   */
  extractAttachmentConfig(attachment: HTMLElement): TConfluenceAttachmentConfig | undefined {
    if (attachment.tagName === "A" || attachment.rawTagName === "a") {
      const attachmentConfig: TConfluenceAttachmentConfig = {
        fileName: attachment.innerText,
        href: attachment.getAttribute("href"),
      };
      return attachmentConfig;
    }
  }
}
