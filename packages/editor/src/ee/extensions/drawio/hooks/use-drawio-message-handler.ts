import { useCallback } from "react";
// types
import { DrawioIframeRef } from "../components/iframe";
import { EDrawioAttributeNames, TDrawioExtension } from "../types";
// utils
import { DRAWIO_EMPTY_CONTENT_LENGTH } from "../utils/constants";
import { validateDrawioMessage, createSecureMessageSender } from "../utils/message-validation";
import { reuploadDiagramFiles, uploadDiagramFiles } from "../utils/upload-file";

type UseDrawioMessageHandlerProps = {
  diagramId: string | undefined;
  imageSrc: string | undefined;
  xmlSrc: string | undefined;
  iframeRef: React.RefObject<DrawioIframeRef>;
  loadXmlContent: () => Promise<string>;
  handleCloseModal: () => void;
  setIsLoading: (loading: boolean) => void;
  updateLiveImageData: (data: string) => void;
  updateImageKey: () => void;
  broadcastDiagramUpdate: (imageData?: string, imageSrc?: string) => void;
  updateAttributes: (attributes: Partial<{ [key in EDrawioAttributeNames]: string | null }>) => void;
  extension: TDrawioExtension;
};

export const useDrawioMessageHandler = ({
  diagramId,
  imageSrc,
  xmlSrc,
  iframeRef,
  loadXmlContent,
  handleCloseModal,
  setIsLoading,
  updateLiveImageData,
  updateImageKey,
  broadcastDiagramUpdate,
  updateAttributes,
  extension,
}: UseDrawioMessageHandlerProps) => {
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      // Validate the message using our security validation
      const validation = validateDrawioMessage(event);

      if (!validation.isValid) {
        console.warn("[Drawio Security] Message validation failed:", validation.error);
        return;
      }

      const msg = validation.message!;
      // Create secure message sender
      const messageSender = createSecureMessageSender(iframeRef);

      try {
        switch (msg.event) {
          case "init": {
            // Load existing XML content for editing
            const xmlContent = await loadXmlContent();
            messageSender.sendToDrawio("load", { xml: xmlContent });
            setTimeout(() => {
              setIsLoading(false);
              iframeRef.current?.showIframe();
            }, 800);
            break;
          }

          case "save":
            messageSender.sendToDrawio("export", {
              format: "svg",
              spinKey: "saving",
            });
            break;

          case "export":
            if (msg.data && msg.xml) {
              try {
                if (diagramId && msg.data && msg.xml) {
                  if (msg.data.length === DRAWIO_EMPTY_CONTENT_LENGTH) {
                    handleCloseModal();
                    return;
                  }

                  // Show the updated image immediately using the exported data
                  updateLiveImageData(msg.data);
                  updateImageKey();

                  // Broadcast the diagram update immediately to other users
                  broadcastDiagramUpdate(msg.data, imageSrc || undefined);

                  // Upload to S3 in the background (don't await)
                  if (imageSrc && xmlSrc) {
                    // Reupload existing diagram
                    reuploadDiagramFiles({
                      imageFile: msg.data,
                      xmlContent: msg.xml,
                      diagramId,
                      updateAttributes,
                      extension,
                      imageSrc,
                      xmlSrc,
                    });
                  } else {
                    // Upload new diagram
                    uploadDiagramFiles({
                      xmlContent: msg.xml,
                      imageFile: msg.data,
                      diagramId,
                      updateAttributes,
                      extension,
                    });
                  }
                }
              } catch (error) {
                console.error("❌ Error processing diagram export:", error);
              }
            }
            handleCloseModal();
            break;

          case "exit":
            handleCloseModal();
            break;
        }
      } catch (error) {
        console.error("❌ Error processing validated draw.io message:", error);
      }
    },
    [
      diagramId,
      imageSrc,
      xmlSrc,
      iframeRef,
      loadXmlContent,
      handleCloseModal,
      setIsLoading,
      updateLiveImageData,
      updateImageKey,
      broadcastDiagramUpdate,
      updateAttributes,
      extension,
    ]
  );

  return { handleMessage };
};
