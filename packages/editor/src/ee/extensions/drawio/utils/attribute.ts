// UUID generation is handled in commands.ts when needed
import { EDrawioAttributeNames, EDrawioMode, TDrawioBlockAttributes } from "../types";

export const DEFAULT_DRAWIO_ATTRIBUTES: TDrawioBlockAttributes = {
  [EDrawioAttributeNames.ID]: null, // Will be generated when needed
  [EDrawioAttributeNames.IMAGE_SRC]: null, // SVG file source/URL
  [EDrawioAttributeNames.XML_SRC]: null, // XML .drawio file source/URL
  [EDrawioAttributeNames.MODE]: EDrawioMode.DIAGRAM, // Default to diagram mode
};
