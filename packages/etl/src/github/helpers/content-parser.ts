import axios from "axios";
import { marked } from "marked";
import { parse, HTMLElement } from "node-html-parser";
import TurndownService from "turndown";
import { PlaneUser, Client as PlaneClient } from "@plane/sdk";
import { GithubService } from "../services";

interface ImageComponent {
  assetId: string;
  src: string;
  width?: string;
  height?: string;
  id?: string;
  aspectRatio?: string;
}

interface ContentParserOptions {
  workspaceSlug?: string;
  userMap?: Record<string, string>;
  planeUsers?: PlaneUser[];
  repo?: string;
  planeClient?: PlaneClient;
  githubService?: GithubService;
  projectId?: string;
}

export class ContentParser {
  private static readonly MENTION_PATTERN = /@([a-zA-Z0-9-]+)/g;
  private static readonly ISSUE_NUMBER_PATTERN = /#(\d+)/g;
  private static readonly MARKDOWN_IMAGE_PATTERN = /\!\[(.*?)\]\((.*?)\)/gim;

  private static readonly turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  /**
   * Converts Plane's HTML (with custom components) to GitHub Markdown
   */
  static toMarkdown(html: string, srcPrefixWithPath: string): string {
    // First convert image components to standard HTML img tags
    const standardHtml = this.replaceImageComponentsWithImgTags(html, srcPrefixWithPath);
    // Use TurndownService to convert HTML to Markdown
    return this.turndownService.turndown(standardHtml);
  }

  /**
   * Extracts image information from HTML content
   * @returns Map of alt text to image URL
   */
  static extractImageInfo(html: string): Map<string, string> {
    const imageMap = new Map<string, string>();
    const root = parse(html);

    const images = root.querySelectorAll("img");
    for (const img of images) {
      const alt = img.getAttribute("alt") || "";
      const src = img.getAttribute("src");
      if (src) {
        imageMap.set(alt, src);
      }
    }

    return imageMap;
  }

  /**
   * Converts GitHub's content (HTML/Markdown/Mixed) to Plane's HTML format
   */
  static async toPlaneHtml(
    content: string,
    imagePrefix: string,
    imageMap: Map<string, string>,
    options?: ContentParserOptions
  ): Promise<string> {
    try {
      // First try to parse as HTML to check if it's valid HTML
      const root = parse(content);
      const isHTML = root.childNodes.some((node) => node.nodeType === 1); // Has HTML elements

      // If the content is not HTML or has markdown-style images, treat it as markdown
      const hasMarkdownImages = this.MARKDOWN_IMAGE_PATTERN.test(content);

      let html = content;
      if (!isHTML || hasMarkdownImages) {
        // Convert markdown to HTML
        html = await marked(content, {
          async: true,
          gfm: true, // GitHub Flavored Markdown
          breaks: true, // Convert line breaks to <br>
        });
      }

      // Process HTML content
      html = await this.processHTML(html, imagePrefix, imageMap, options);

      return html;
    } catch (error) {
      console.error("Error parsing content", error);
      // If HTML parsing fails, treat as markdown
      const html = await marked(content, {
        async: true,
        gfm: true,
        breaks: true,
      });
      return await this.processHTML(html, imagePrefix, imageMap, options);
    }
  }

  /**
   * Process HTML content by handling images, mentions, and issue numbers
   */
  private static async processHTML(
    html: string,
    imagePrefix: string,
    imageMap: Map<string, string>,
    options?: ContentParserOptions
  ): Promise<string> {
    // Process the entire HTML string for markdown-style images
    html = await this.processMarkdownImages(html, imagePrefix, imageMap, options || {});

    // Process HTML img tags
    const root = parse(html);
    await this.processImgTags(root, imagePrefix, imageMap, options || {});
    html = root.toString();

    // Handle mentions if user mapping is provided
    if (options?.workspaceSlug && options?.userMap && options?.planeUsers) {
      html = this.replaceMentions(html, options.workspaceSlug, options.userMap, options.planeUsers);
    }

    return html;
  }

  private static replaceImageComponentsWithImgTags(html: string, srcPrefix: string): string {
    const root = parse(html);
    const imageComponents = root.querySelectorAll("image-component");

    imageComponents.forEach((component) => {
      // Extract all attributes
      const src = component.getAttribute("src");
      if (!src) return;

      const width = component.getAttribute("width");
      const height = component.getAttribute("height");
      const aspectRatio = component.getAttribute("aspectratio");

      // Create img tag with appropriate attributes
      const img = new HTMLElement("img", {}, "");
      img.setAttribute("src", `${srcPrefix}/${src}`);
      if (width) img.setAttribute("width", width);
      if (height) img.setAttribute("height", height);
      if (aspectRatio) img.setAttribute("data-aspect-ratio", aspectRatio);

      // Replace the image-component with the img tag
      component.replaceWith(img);
    });

    return root.toString();
  }

  private static async downloadAndUploadImage(url: string, options: ContentParserOptions): Promise<string | null> {
    if (!options.planeClient || !options.workspaceSlug || !options.githubService) return null;

    // Extract filename from URL or use default text
    const fileName = url.split("/").pop()?.split("?")[0] || "View attached image";
    const imageText = fileName;

    try {
      const blob = await downloadFile(url);
      if (!blob) return null;

      // Upload using AssetService
      const assetId = await options.planeClient.assets.uploadAsset(
        options.workspaceSlug,
        // @ts-expect-error
        blob,
        "image",
        blob.size,
        {
          external_source: "github",
          project_id: options.projectId,
        }
      );

      return assetId;
    } catch (error) {
      // If any error occurs during download or upload, return markdown link
      return `${url}`;
    }
  }

  private static async processMarkdownImages(
    text: string,
    imagePrefix: string,
    imageMap: Map<string, string>,
    options: ContentParserOptions
  ): Promise<string> {
    // Parse the html recieved and get the markdown images with regex
    const _ = this.MARKDOWN_IMAGE_PATTERN.exec(text);
    const matches = Array.from(text.matchAll(this.MARKDOWN_IMAGE_PATTERN));
    let result = text;

    for (const match of matches) {
      const [fullMatch, name, src] = match;
      if (!src.includes(imagePrefix)) {
        // get the name of the image out of the url
        const presignedUrl = imageMap.get(name);
        if (!presignedUrl) {
          console.log("No presigned url found for", name);
          continue;
        }
        const assetId = await this.downloadAndUploadImage(presignedUrl, options);
        if (assetId) {
          result = result.replace(fullMatch, `<image-component src="${assetId}" />`);
        } else {
          // Keep the image as it is
          result = result.replace(fullMatch, `<img src="${presignedUrl}" />`);
        }
      } else {
        const assetId = src.split("/").pop() || "";
        result = result.replace(fullMatch, `<image-component src="${assetId}" />`);
      }
    }

    return result;
  }

  private static async processImgTags(
    root: HTMLElement,
    imagePrefix: string,
    imageMap: Map<string, string>,
    options: ContentParserOptions
  ): Promise<void> {
    const images = root.querySelectorAll("img");

    for (const img of images) {
      const alt = img.getAttribute("alt");
      const baseSrc = img.getAttribute("src");
      if (!alt) continue;

      // Get the presigned url from the image map
      const presignedUrl = imageMap.get(alt);
      if (!presignedUrl) continue;

      let assetId: string | null = null;

      if (!alt.includes(imagePrefix)) {
        assetId = await this.downloadAndUploadImage(presignedUrl, options);
      } else {
        assetId = alt.split("/").pop() || "";
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

        img.replaceWith(component);
      }
    }
  }

  private static getAssetUrl(assetId: string): string {
    return `/api/assets/${assetId}`;
  }

  private static replaceMentions(
    html: string,
    workspaceSlug: string,
    userMap: Record<string, string>,
    planeUsers: PlaneUser[]
  ): string {
    const root = parse(html);
    const text = root.text;
    const matches = text.match(this.MENTION_PATTERN);

    if (!matches) return html;

    matches.forEach((match) => {
      const username = match.slice(1);

      if (!userMap[username]) {
        html = html.replace(match, `<a href="https://github.com/${username}">From GitHub: ${username}</a>`);
      } else {
        const user = planeUsers.find((user) => user.id === userMap[username]);
        if (user) {
          const component = this.createMentionComponent(workspaceSlug, user);
          html = html.replace(match, component);
        } else {
          html = html.replace(match, `<a href="https://github.com/${username}">From GitHub: ${username}</a>`);
        }
      }
    });

    return html;
  }

  private static createMentionComponent(workspaceSlug: string, user: PlaneUser): string {
    return `<mention-component
      entity_name="user_mention"
      label="${user.display_name}"
      entity_identifier="${user.id}"
      id="${user.id}"
      type="User"
      title="${user.display_name}"
      subtitle="${user.email ?? ""}"
      avatar="${user.avatar}"
      redirect_uri="/${workspaceSlug}/profile/${user.id}"
    ></mention-component>`;
  }

  private static replaceIssueNumbers(html: string, repo: string): string {
    const root = parse(html);
    const text = root.text;
    const matches = text.match(this.ISSUE_NUMBER_PATTERN);

    if (!matches) return html;

    matches.forEach((match) => {
      const issueNumber = match.slice(1);
      html = html.replace(
        match,
        `<a href="https://github.com/${repo}/issues/${issueNumber}">${repo} #${issueNumber}</a>`
      );
    });

    return html;
  }

  /**
   * Helper method to extract all image components from HTML
   */
  static extractImageComponents(html: string): ImageComponent[] {
    const root = parse(html);
    const components = root.querySelectorAll("image-component");

    return components.map((component) => ({
      assetId: component.getAttribute("src") || "",
      src: this.getAssetUrl(component.getAttribute("src") || ""),
      width: component.getAttribute("width") || undefined,
      height: component.getAttribute("height") || undefined,
      id: component.getAttribute("id") || undefined,
      aspectRatio: component.getAttribute("aspectratio") || undefined,
    }));
  }
}

export const downloadFile = async (url: string): Promise<Blob | undefined> => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);
    const blob = new Blob([buffer], { type: response.headers["content-type"] });
    return blob;
  } catch (e) {
    console.error("Assest download failed", e);
  }
};
