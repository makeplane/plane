import { Plugin, PluginKey } from "@tiptap/pm/state";
import { assetDuplicationHandlers } from "@/plane-editor/helpers/asset-duplication";

export const PasteAssetPlugin = (): Plugin =>
  new Plugin({
    key: new PluginKey("paste-asset-duplication"),
    props: {
      handlePaste: (view, event) => {
        if (!event.clipboardData) return false;

        const htmlContent = event.clipboardData.getData("text/html");
        if (!htmlContent || htmlContent.includes('data-uploaded="true"')) return false;

        // Process the HTML content using the registry
        const { processedHtml, hasChanges } = processAssetDuplication(htmlContent);

        if (!hasChanges) return false;

        event.preventDefault();
        event.stopPropagation();

        // Mark the content as already processed to avoid infinite loops
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = processedHtml;
        const metaTag = tempDiv.querySelector("meta[charset='utf-8']");
        if (metaTag) {
          metaTag.setAttribute("data-uploaded", "true");
        }
        const finalHtml = tempDiv.innerHTML;

        const newDataTransfer = new DataTransfer();
        newDataTransfer.setData("text/html", finalHtml);
        if (event.clipboardData) {
          newDataTransfer.setData("text/plain", event.clipboardData.getData("text/plain"));
        }

        const pasteEvent = new ClipboardEvent("paste", {
          clipboardData: newDataTransfer,
          bubbles: true,
          cancelable: true,
        });

        view.dom.dispatchEvent(pasteEvent);

        return true;
      },
    },
  });

// Utility function to process HTML content with all registered handlers
const processAssetDuplication = (htmlContent: string): { processedHtml: string; hasChanges: boolean } => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  let processedHtml = htmlContent;
  let hasChanges = false;

  // Process each registered component type
  for (const [componentName, handler] of Object.entries(assetDuplicationHandlers)) {
    const elements = tempDiv.querySelectorAll(componentName);

    if (elements.length > 0) {
      elements.forEach((element) => {
        const result = handler({ element, originalHtml: processedHtml });
        if (result.shouldProcess) {
          processedHtml = result.modifiedHtml;
          hasChanges = true;
        }
      });

      // Update tempDiv with processed HTML for next iteration
      tempDiv.innerHTML = processedHtml;
    }
  }

  return { processedHtml, hasChanges };
};
