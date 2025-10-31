import { Plugin, PluginKey } from "@tiptap/pm/state";
import { v4 as uuidv4 } from "uuid";

export const AssetDuplicationPlugin = (): Plugin =>
  new Plugin({
    key: new PluginKey("asset-duplication"),
    props: {
      handlePaste: (view, event, _slice) => {
        console.log("handlePaste from asset-duplication plugin", event);
        if (!event.clipboardData) return false;

        const htmlContent = event.clipboardData.getData("text/html");
        if (!htmlContent || htmlContent.includes('data-duplicated="true"')) return false;

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlContent;
        const imageComponents = tempDiv.querySelectorAll("image-component");

        if (imageComponents.length === 0) return false;

        event.preventDefault();
        event.stopPropagation();

        let updatedHtml = htmlContent;
        imageComponents.forEach((component) => {
          const src = component.getAttribute("src");
          if (src) {
            const newId = uuidv4();
            const originalTag = component.outerHTML;
            const modifiedTag = originalTag
              .replace(`<image-component`, `<image-component status="duplicating"`)
              .replace(/id="[^"]*"/, `id="${newId}"`);
            updatedHtml = updatedHtml.replace(originalTag, modifiedTag);
          }
        });

        updatedHtml = updatedHtml.replace("<meta charset='utf-8'>", "<meta charset='utf-8' data-duplicated=\"true\">");

        const newDataTransfer = new DataTransfer();
        newDataTransfer.setData("text/html", updatedHtml);
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
