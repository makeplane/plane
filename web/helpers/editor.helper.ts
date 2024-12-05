// plane editor
import { TFileHandler } from "@plane/editor";
// helpers
import { getBase64Image, getFileURL } from "@/helpers/file.helper";
// services
import { FileService } from "@/services/file.service";
const fileService = new FileService();

type TEditorSrcArgs = {
  assetId: string;
  projectId?: string;
  workspaceSlug: string;
};

/**
 * @description generate the file source using assetId
 * @param {TEditorSrcArgs} args
 */
export const getEditorAssetSrc = (args: TEditorSrcArgs): string | undefined => {
  const { assetId, projectId, workspaceSlug } = args;
  let url: string | undefined = "";
  if (projectId) {
    url = getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/projects/${projectId}/${assetId}/`);
  } else {
    url = getFileURL(`/api/assets/v2/workspaces/${workspaceSlug}/${assetId}/`);
  }
  return url;
};

type TArgs = {
  maxFileSize: number;
  projectId?: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  workspaceSlug: string;
};

/**
 * @description this function returns the file handler required by the editors
 * @param {TArgs} args
 */
export const getEditorFileHandlers = (args: TArgs): TFileHandler => {
  const { maxFileSize, projectId, uploadFile, workspaceId, workspaceSlug } = args;

  return {
    getAssetSrc: async (path) => {
      if (!path) return "";
      if (path?.startsWith("http")) {
        return path;
      } else {
        return (
          getEditorAssetSrc({
            assetId: path,
            projectId,
            workspaceSlug,
          }) ?? ""
        );
      }
    },
    upload: uploadFile,
    delete: async (src: string) => {
      if (src?.startsWith("http")) {
        await fileService.deleteOldWorkspaceAsset(workspaceId, src);
      } else {
        await fileService.deleteNewAsset(
          getEditorAssetSrc({
            assetId: src,
            projectId,
            workspaceSlug,
          }) ?? ""
        );
      }
    },
    restore: async (src: string) => {
      if (src?.startsWith("http")) {
        await fileService.restoreOldEditorAsset(workspaceId, src);
      } else {
        await fileService.restoreNewAsset(workspaceSlug, src);
      }
    },
    cancel: fileService.cancelUpload,
    validation: {
      maxFileSize,
    },
  };
};

/**
 * @description this function returns the file handler required by the read-only editors
 */
export const getReadOnlyEditorFileHandlers = (
  args: Pick<TArgs, "projectId" | "workspaceSlug">
): { getAssetSrc: TFileHandler["getAssetSrc"] } => {
  const { projectId, workspaceSlug } = args;

  return {
    getAssetSrc: async (path) => {
      if (!path) return "";
      if (path?.startsWith("http")) {
        return path;
      } else {
        return (
          getEditorAssetSrc({
            assetId: path,
            projectId,
            workspaceSlug,
          }) ?? ""
        );
      }
    },
  };
};

/**
 * @description function to replace all the custom components from the html component to make it pdf compatible
 * @param props
 * @returns {Promise<string>}
 */
export const replaceCustomComponentsFromHTMLContent = async (props: {
  htmlContent: string;
  noAssets?: boolean;
}): Promise<string> => {
  const { htmlContent, noAssets = false } = props;
  // create a DOM parser
  const parser = new DOMParser();
  // parse the HTML string into a DOM document
  const doc = parser.parseFromString(htmlContent, "text/html");
  // replace all mention-component elements
  const mentionComponents = doc.querySelectorAll("mention-component");
  mentionComponents.forEach((component) => {
    // get the user label from the component (or use any other attribute)
    const label = component.getAttribute("label") || "user";
    // create a span element to replace the mention-component
    const span = doc.createElement("span");
    span.setAttribute("data-node-type", "mention-block");
    span.textContent = `@${label}`;
    // replace the mention-component with the anchor element
    component.replaceWith(span);
  });
  // handle code inside pre elements
  const preElements = doc.querySelectorAll("pre");
  preElements.forEach((preElement) => {
    const codeElement = preElement.querySelector("code");
    if (codeElement) {
      // create a div element with the required attributes for code blocks
      const div = doc.createElement("div");
      div.setAttribute("data-node-type", "code-block");
      div.setAttribute("class", "courier");
      // transfer the content from the code block
      div.innerHTML = codeElement.innerHTML.replace(/\n/g, "<br>") || "";
      // replace the pre element with the new div
      preElement.replaceWith(div);
    }
  });
  // handle inline code elements (not inside pre tags)
  const inlineCodeElements = doc.querySelectorAll("code");
  inlineCodeElements.forEach((codeElement) => {
    // check if the code element is inside a pre element
    if (!codeElement.closest("pre")) {
      // create a span element with the required attributes for inline code blocks
      const span = doc.createElement("span");
      span.setAttribute("data-node-type", "inline-code-block");
      span.setAttribute("class", "courier-bold");
      // transfer the code content
      span.textContent = codeElement.textContent || "";
      // replace the standalone code element with the new span
      codeElement.replaceWith(span);
    }
  });
  // handle image-component elements
  const imageComponents = doc.querySelectorAll("image-component");
  if (noAssets) {
    // if no assets is enabled, remove the image component elements
    imageComponents.forEach((component) => component.remove());
    // remove default img elements
    const imageElements = doc.querySelectorAll("img");
    imageElements.forEach((img) => img.remove());
  } else {
    // if no assets is not enabled, replace the image component elements with img elements
    imageComponents.forEach((component) => {
      // get the image src from the component
      const src = component.getAttribute("src") ?? "";
      const height = component.getAttribute("height") ?? "";
      const width = component.getAttribute("width") ?? "";
      // create an img element to replace the image-component
      const img = doc.createElement("img");
      img.src = src;
      img.style.height = height;
      img.style.width = width;
      // replace the image-component with the img element
      component.replaceWith(img);
    });
  }
  // convert all images to base64
  const imgElements = doc.querySelectorAll("img");
  await Promise.all(
    Array.from(imgElements).map(async (img) => {
      // get the image src from the img element
      const src = img.getAttribute("src");
      if (src) {
        try {
          const base64Image = await getBase64Image(src);
          img.src = base64Image;
        } catch (error) {
          // log the error if the image conversion fails
          console.error("Failed to convert image to base64:", error);
        }
      }
    })
  );
  // replace all checkbox elements
  const checkboxComponents = doc.querySelectorAll("input[type='checkbox']");
  checkboxComponents.forEach((component) => {
    // get the checked status from the element
    const checked = component.getAttribute("checked");
    // create a div element to replace the input element
    const div = doc.createElement("div");
    div.classList.value = "input-checkbox";
    // add the checked class if the checkbox is checked
    if (checked === "checked" || checked === "true") div.classList.add("checked");
    // replace the input element with the div element
    component.replaceWith(div);
  });
  // remove all issue-embed-component elements
  const issueEmbedComponents = doc.querySelectorAll("issue-embed-component");
  issueEmbedComponents.forEach((component) => component.remove());
  // serialize the document back into a string
  let serializedDoc = doc.body.innerHTML;
  // remove null colors from table elements
  serializedDoc = serializedDoc.replace(/background-color: null/g, "").replace(/color: null/g, "");
  return serializedDoc;
};

/**
 * @description function to replace all the custom components from the markdown content
 * @param props
 * @returns {string}
 */
export const replaceCustomComponentsFromMarkdownContent = (props: {
  markdownContent: string;
  noAssets?: boolean;
}): string => {
  const { markdownContent, noAssets = false } = props;
  let parsedMarkdownContent = markdownContent;
  // replace the matched mention components with [label](redirect_uri)
  const mentionRegex = /<mention-component[^>]*label="([^"]+)"[^>]*redirect_uri="([^"]+)"[^>]*><\/mention-component>/g;
  const originUrl = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

  parsedMarkdownContent = parsedMarkdownContent.replace(
    mentionRegex,
    (_match, label, redirectUri) => `[${label}](${originUrl}/${redirectUri})`
  );
  // replace the matched image components with <img src={src} >
  const imageComponentRegex = /<image-component[^>]*src="([^"]+)"[^>]*>[^]*<\/image-component>/g;
  const imgTagRegex = /<img[^>]*src="([^"]+)"[^>]*\/?>/g;
  if (noAssets) {
    // remove all image components
    parsedMarkdownContent = parsedMarkdownContent.replace(imageComponentRegex, "").replace(imgTagRegex, "");
  } else {
    // replace the matched image components with <img src={src} >
    parsedMarkdownContent = parsedMarkdownContent.replace(imageComponentRegex, (_match, src) => `<img src="${src}" >`);
  }
  // remove all issue-embed components
  const issueEmbedRegex = /<issue-embed-component[^>]*>[^]*<\/issue-embed-component>/g;
  parsedMarkdownContent = parsedMarkdownContent.replace(issueEmbedRegex, "");
  return parsedMarkdownContent;
};

export const getTextContent = (jsx: JSX.Element | React.ReactNode | null | undefined): string => {
  if (!jsx) return "";

  const div = document.createElement("div");
  div.innerHTML = jsx.toString();
  return div.textContent?.trim() ?? "";
};
