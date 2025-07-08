import { HTMLElement, TextNode } from "node-html-parser";
import { FileHelper, FileHelperConfig } from "../../helpers";
import { IParserExtension } from "../../types";

export type ExternalImageParserConfig = FileHelperConfig & {
  /*
    If you need to exclude an image from being uploaded, you can use this config.
    Can be useful in cases of sync, where you want to avoid re-uploading images from Plane to Plane.
    Check plane/image-proxy-extension.ts for more details.
  */
  excludedImagePrefix?: string;
  /*
    Image map is used in cases where the presigned URL is not src, in cases like these, a map can be given
    which maps the alt text to the presigned URL.
  */
  altUrlMap?: Map<string, string>;
}

/*
  This extension is used to parse images from external sources and upload them to Plane.
*/
export class ExternalImageParserExtension implements IParserExtension {
  private fileHelper: FileHelper;

  constructor(private readonly config: ExternalImageParserConfig) {
    this.fileHelper = new FileHelper(config);
  }

  shouldParse(node: HTMLElement): boolean {
    // We only want to handle single IMG tags directly
    // Parent replacement will be handled by a special parent-handling extension
    return node.tagName === 'IMG';
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    if (node.tagName === 'IMG') {
      return await this.processImgTag(node);
    }
    return node;
  }

  private async processImgTag(img: HTMLElement): Promise<HTMLElement> {
    const alt = img.getAttribute("alt");
    const baseSrc = img.getAttribute("src");

    let downloadUrl: string | null = null;
    let assetId: string | null = null;

    const presignedUrl = this.config.altUrlMap?.get(alt ?? "");

    if (!presignedUrl) {
      downloadUrl = baseSrc || null;
      if (downloadUrl) {
        assetId = await this.fileHelper.downloadAndUploadFile(downloadUrl);
      }
    } else {
      assetId = await this.fileHelper.downloadAndUploadFile(presignedUrl);
    }

    if (assetId) {
      const component = new HTMLElement("image-component", {}, "");
      component.setAttribute("src", assetId);

      // Copy relevant attributes
      const width = img.getAttribute("width");
      const height = img.getAttribute("height");
      const aspectRatio = img.getAttribute("data-aspect-ratio");

      if (width) component.setAttribute("width", width);
      if (height) component.setAttribute("height", height);
      if (aspectRatio) component.setAttribute("aspectratio", aspectRatio);

      return component;
    }

    return img;
  }
}

/**
 * This extension handles parent elements (P or SPAN) that wrap a single media element.
 * It extracts the media element from its parent, allowing the parent to be replaced.
 */
export class PTagCustomComponentExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    // Only handle P or SPAN nodes that have exactly one child
    if ((node.tagName === 'P' || node.tagName === 'SPAN')) {

      // Check for the child nodes, and remove empty text nodes
      const childNodes = node.childNodes.filter((child) => {
        if (child instanceof TextNode) {
          return child.textContent.trim() !== "";
        }
        return true;
      });

      if (childNodes.length === 1) {
        const child = node.childNodes[0];
        // Check if the child is an element (not text) and is a media element
        if (child instanceof HTMLElement) {
          return [
            'IMAGE-COMPONENT',
            'MENTION-COMPONENT',
            'ISSUE-EMBED-COMPONENT',
          ].includes(child.tagName);
        }
      }
    }
    return false;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Extract the wrapped child element
    const child = node.childNodes[0] as HTMLElement;

    // Return the child element to replace the parent
    return child;
  }
}
