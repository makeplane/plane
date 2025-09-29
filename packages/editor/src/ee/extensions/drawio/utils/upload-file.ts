import { DrawioNodeViewProps } from "../components/node-view";
import { TDrawioExtension, EDrawioAttributeNames } from "../types";
import { base64ToFile } from "./base64-to-file";

// Helper function to create diagram files with error handling
const createDiagramFiles = (
  imageFile: string,
  xmlContent: string,
  diagramId: string
): { imageFile: File; xmlFile: File } => {
  // Handle image file creation
  let newImageFile: File;

  if (imageFile.startsWith("data:image/svg+xml;base64,")) {
    // It's a base64 data URL, convert it to File with error handling
    newImageFile = base64ToFile(imageFile, `${diagramId}.svg`, "image/svg+xml");
  } else {
    // It's raw SVG content, create File directly
    newImageFile = new File([imageFile], `${diagramId}.svg`, { type: "image/svg+xml" });
  }

  // Create .drawio file for XML content
  const newXmlFile = new File([xmlContent], `${diagramId}.drawio`, { type: "application/xml" });

  return { imageFile: newImageFile, xmlFile: newXmlFile };
};

// Upload SVG and XML files separately
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
    // Create diagram files with error handling
    const { imageFile: newImageFile, xmlFile: newXmlFile } = createDiagramFiles(imageFile, xmlContent, diagramId);

    // Upload both files
    const [imageUrl, xmlUrl] = await Promise.all([
      extension.options.uploadDiagram(`${diagramId}`, newImageFile),
      extension.options.uploadDiagram(`${diagramId}`, newXmlFile),
    ]);

    // Update attributes with the uploaded file URLs/IDs
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
  if (!diagramId || !extension?.options.reuploadDiagram) {
    return;
  }

  try {
    // Create diagram files with error handling
    const { imageFile: newImageFile, xmlFile: newXmlFile } = createDiagramFiles(imageFile, xmlContent, diagramId);

    // Reupload both files using the original asset IDs
    const [imageUrl, xmlUrl] = await Promise.all([
      extension.options.reuploadDiagram(`${diagramId}`, newImageFile, imageSrc),
      extension.options.reuploadDiagram(`${diagramId}`, newXmlFile, xmlSrc),
    ]);

    // Update attributes with the uploaded file URLs/IDs
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
