export const VIDEO_ARTIFACT_FORMATS = new Set([
  "mov",
  "webm",
  "avi",
  "mkv",
  "mpeg",
  "mpg",
  "m4v",
  "mp4",
  "m3u8",
  "stream",
]);

export const IMAGE_ARTIFACT_FORMATS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "heic",
  "heif",
  "tif",
  "tiff",
]);

export const VIDEO_ARTIFACT_ACTIONS = new Set(["play", "stream", "play_hls", "play_streaming", "open_mp4"]);
export const IMAGE_ARTIFACT_ACTIONS = new Set(["open_image", "view_image"]);

export const HLS_MIME_TYPES = ["application/x-mpegURL", "application/vnd.apple.mpegurl"] as const;

export const TEXT_DOCUMENT_FORMATS = new Set(["txt", "json", "md", "log", "yaml", "yml", "xml"]);
export const SPREADSHEET_FORMATS = new Set(["xlsx", "xls", "csv"]);
export const SUPPORTED_DOCUMENT_FORMATS = new Set([
  "pdf",
  "docx",
  "xlsx",
  "xls",
  "csv",
  "txt",
  "json",
  "md",
  "log",
  "yaml",
  "yml",
  "xml",
]);

export const WEBHOOK_DOCUMENT_PREVIEW_HEIGHT_CLASS = "h-[220px] sm:h-[320px] md:h-[420px] lg:h-[505px]";
