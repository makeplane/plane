// types
import { TDisplayConfig } from "@/types";

export const DEFAULT_DISPLAY_CONFIG: TDisplayConfig = {
  fontSize: "large-font",
  fontStyle: "sans-serif",
};

export const ACCEPTED_FILE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
export const ACCEPTED_FILE_EXTENSIONS = ACCEPTED_FILE_MIME_TYPES.map((type) => `.${type.split("/")[1]}`);
