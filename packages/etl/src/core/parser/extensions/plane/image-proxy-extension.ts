import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "../..";

const IMAGE_COMPONENT_SELECTOR = "image-component";

interface ImageProxyParserConfig {
  /*
    The prefix to use for the image proxy. Ideally it's a route from Silo
    which can be used to get the presigned URL for the image.
  */
  srcPrefix: string;
}

/*
  The extension replaces image-component tags with img tags, but it's uses the URL from silo,
  as silo can access credentials to get the presigned URL, hence, proxying the image.
*/
export class ImageProxyParserExtension implements IParserExtension {
  private readonly IMAGE_COMPONENT_SELECTOR = "image-component";
  private config: ImageProxyParserConfig;

  constructor(config: ImageProxyParserConfig) {
    this.config = config;
  }

  shouldParse(node: HTMLElement): boolean {
    // This extension should run if there are any image-component tags in the HTML
    return node.tagName === IMAGE_COMPONENT_SELECTOR;
  }

  async mutate(root: HTMLElement): Promise<HTMLElement> {
    // Extract all attributes
    const src = root.getAttribute("src");
    if (!src) return root;

    const width = root.getAttribute("width");
    const height = root.getAttribute("height");
    const aspectRatio = root.getAttribute("aspectratio");

    // Create img tag with appropriate attributes
    const img = new HTMLElement("img", {}, "");
    img.setAttribute("src", `${this.config.srcPrefix}/${src}`);
    if (width) img.setAttribute("width", width);
    if (height) img.setAttribute("height", height);
    if (aspectRatio) img.setAttribute("data-aspect-ratio", aspectRatio);

    // Replace the image-component with the img tag
    root.replaceWith(img);
    return root;
  }
}
