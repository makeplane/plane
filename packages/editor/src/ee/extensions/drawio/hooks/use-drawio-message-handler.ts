/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
// types
import type { DrawioIframeRef } from "../components/iframe";
import type { TDrawioBlockAttributes, TDrawioExtension } from "../types";
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
  onXmlSaved?: (xmlContent: string) => void;
  updateAttributes: (attributes: Partial<TDrawioBlockAttributes>) => void;
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
  onXmlSaved,
  updateAttributes,
  extension,
}: UseDrawioMessageHandlerProps) => {
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      const validation = validateDrawioMessage(event);

      if (!validation.isValid) {
        console.warn("[Drawio Security] Message validation failed:", validation.error);
        return;
      }

      const msg = validation.message!;
      const messageSender = createSecureMessageSender(iframeRef);

      try {
        switch (msg.event) {
          case "init": {
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
              format: "png",
              spinKey: "saving",
            });
            break;

          case "export":
            if (msg.data && msg.xml) {
              try {
                if (diagramId) {
                  if (msg.data.length === DRAWIO_EMPTY_CONTENT_LENGTH) {
                    handleCloseModal();
                    return;
                  }

                  if (imageSrc && xmlSrc) {
                    await reuploadDiagramFiles({
                      imageFile: msg.data,
                      xmlContent: msg.xml,
                      diagramId,
                      updateAttributes,
                      extension,
                      imageSrc,
                      xmlSrc,
                    });
                  } else {
                    await uploadDiagramFiles({
                      xmlContent: msg.xml,
                      imageFile: msg.data,
                      diagramId,
                      updateAttributes,
                      extension,
                    });
                  }

                  onXmlSaved?.(msg.xml);
                }
              } catch (error) {
                console.error("Error processing diagram export:", error);
              }
            }
            break;

          case "exit":
            handleCloseModal();
            break;
        }
      } catch (error) {
        console.error("Error processing draw.io message:", error);
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
      onXmlSaved,
      updateAttributes,
      extension,
    ]
  );

  return { handleMessage };
};
