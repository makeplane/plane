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

import type { DrawioNodeViewProps } from "../components/node-view";
import type { TDrawioExtension } from "../types";
import { EDrawioAttributeNames } from "../types";
import { base64ToFile } from "./base64-to-file";

const createDiagramFiles = (
  imageFile: string,
  xmlContent: string,
  diagramId: string
): { imageFile: File; xmlFile: File } => {
  const newImageFile: File = base64ToFile(imageFile, `${diagramId}.png`, "image/png");
  const newXmlFile = new File([xmlContent], `${diagramId}.drawio`, { type: "application/xml" });

  return { imageFile: newImageFile, xmlFile: newXmlFile };
};

export const uploadDiagramFiles = async ({
  imageFile,
  xmlContent,
  diagramId,
  updateAttributes,
  extension,
}: {
  imageFile: string;
  xmlContent: string;
  diagramId: string;
  updateAttributes: DrawioNodeViewProps["updateAttributes"];
  extension: TDrawioExtension;
}) => {
  if (!diagramId || !extension?.options.uploadDiagram) return;

  try {
    const { imageFile: newImageFile, xmlFile: newXmlFile } = createDiagramFiles(imageFile, xmlContent, diagramId);

    const [imageUrl, xmlUrl] = await Promise.all([
      extension.options.uploadDiagram(`${diagramId}`, newImageFile),
      extension.options.uploadDiagram(`${diagramId}`, newXmlFile),
    ]);

    updateAttributes({
      [EDrawioAttributeNames.IMAGE_SRC]: imageUrl,
      [EDrawioAttributeNames.XML_SRC]: xmlUrl,
    });

    return { imageUrl, xmlUrl };
  } catch (error) {
    console.error("Error uploading diagram files:", error);
    throw error;
  }
};

export const reuploadDiagramFiles = async ({
  imageFile,
  xmlContent,
  diagramId,
  updateAttributes,
  extension,
  imageSrc,
  xmlSrc,
}: {
  imageFile: string;
  xmlContent: string;
  diagramId: string;
  updateAttributes: DrawioNodeViewProps["updateAttributes"];
  extension: TDrawioExtension;
  imageSrc: string;
  xmlSrc: string;
}) => {
  if (!diagramId || !extension?.options.reuploadDiagram) return;

  try {
    const { imageFile: newImageFile, xmlFile: newXmlFile } = createDiagramFiles(imageFile, xmlContent, diagramId);

    const [imageUrl, xmlUrl] = await Promise.all([
      extension.options.reuploadDiagram(`${diagramId}`, newImageFile, imageSrc),
      extension.options.reuploadDiagram(`${diagramId}`, newXmlFile, xmlSrc),
    ]);

    updateAttributes({
      [EDrawioAttributeNames.IMAGE_SRC]: imageUrl,
      [EDrawioAttributeNames.XML_SRC]: xmlUrl,
    });

    return { imageUrl, xmlUrl };
  } catch (error) {
    console.error("Error reuploading diagram files:", error);
    throw error;
  }
};
