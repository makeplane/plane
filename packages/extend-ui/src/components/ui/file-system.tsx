"use client";

import * as React from "react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Calendar03Icon,
  Cancel01Icon,
  File01Icon,
  FilterIcon,
  GalleryThumbnailsIcon,
  GridViewIcon,
  LayoutThreeColumnIcon,
  LeftToRightListBulletIcon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  createFileTreeIconResolver,
  getBuiltInSpriteSheet,
  prepareFileTreeInput,
  type FileTreeSortComparator,
  type FileTreeSortEntry,
} from "@pierre/trees";
import { FileTree as PierreFileTree, useFileTree } from "@pierre/trees/react";
import { createPortal } from "react-dom";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogPanel, DialogTitle } from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { FileThumbnail } from "./file-thumbnail";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea, ScrollAreaPrimitive } from "./scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Spinner } from "./spinner";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

const LazyPDFViewer = React.lazy(() =>
  import("./pdf-viewer").then((mod) => ({
    default: mod.PDFViewer,
  }))
);
const LazyDocxViewerPreview = React.lazy(() =>
  import("./docx-viewer").then((mod) => ({
    default: mod.DocxViewerPreview,
  }))
);
const LazyXlsxViewerPreview = React.lazy(() =>
  import("./xlsx-viewer").then((mod) => ({
    default: mod.XlsxViewerPreview,
  }))
);
// Local addition: CSV/TSV preview support
const LazyCsvViewer = React.lazy(() =>
  import("./csv-viewer").then((mod) => ({
    default: mod.CsvViewer,
  }))
);

/** Local addition: fetches the CSV text behind a resolved URL and renders the grid. */
function CsvViewerFromUrl({ url, className }: { url: string; className?: string }) {
  const [data, setData] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    setData(null);
    setFailed(false);
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) setData(text);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  if (failed) return <div className="text-muted-foreground grid h-full place-items-center text-sm">–</div>;
  if (data === null) return <FileSystemViewerLoading />;
  return <LazyCsvViewer data={data} className={className} />;
}

export type FileSystemView = "icons" | "list" | "columns" | "gallery";

export type FileSystemFolderItem = {
  kind: "folder";
  /** Folder prefix, e.g. `"invoices/2026/"`. A trailing slash is added when missing. */
  path: string;
  name?: string;
  parentPath?: string;
  /** Set when children exist but are not in `items` yet; enables `loadChildren`. */
  hasChildren?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type FileSystemFileItem = {
  kind: "file";
  /** Display/canonical path, e.g. `"invoices/2026/jan.pdf"`. */
  path: string;
  /** Original object key (S3/R2). Defaults to `path`. */
  key?: string;
  name?: string;
  parentPath?: string;
  contentType?: string;
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  etag?: string;
  /** Optional if already public/presigned. Otherwise resolved via `getFileUrl`. */
  url?: string;
  /** Externally generated thumbnail. The component never renders documents itself. */
  previewImageUrl?: string | null;
  /**
   * Externally generated page thumbnails (first entry is the cover). When a
   * file has more than one page, large thumbnails show a hover pager.
   */
  previewImageUrls?: string[] | null;
  /**
   * Total page count when it exceeds `previewImageUrls.length`; the pager
   * loads the remaining pages on demand via `loadPreviewImageUrl`.
   */
  previewPageCount?: number;
  /** Thumbnail aspect ratio (width / height). Defaults to a portrait page. */
  previewAspectRatio?: number;
  metadata?: Record<string, string>;
};

export type FileSystemItem = FileSystemFolderItem | FileSystemFileItem;

export type FileSystemLoadChildrenArgs = {
  path: string;
  cursor: string | null;
};

export type FileSystemLoadChildrenResult = {
  items: FileSystemItem[];
  nextCursor?: string | null;
};

export type FileSystemProps = {
  /** Flat manifest. Folders are optional; missing prefixes are inferred from file paths. */
  items: FileSystemItem[];
  className?: string;
  /** Label for the root folder. */
  title?: string;
  defaultView?: FileSystemView;
  view?: FileSystemView;
  onViewChange?: (view: FileSystemView) => void;
  /** Folder prefix to open initially, e.g. `"invoices/"`. */
  defaultPath?: string;
  /** Local addition: reports the folder prefix the user navigated to. */
  onPathChange?: (path: string) => void;
  /** Local addition: hides the built-in sort/filter/search cluster (the host provides its own, e.g. server-driven). */
  hideToolbarControls?: boolean;
  /** Local addition: externally controlled sort; folders always sort first. */
  sortOverride?: { key: FileSystemSortKey; direction: "asc" | "desc" };
  onSelectionChange?: (item: FileSystemItem | null) => void;
  /**
   * Called on file open (double-click), replacing the built-in behavior. By
   * default PDF, DOCX, XLSX, and image files open in a viewer dialog and
   * other files open their resolved URL in a new tab.
   */
  onFileOpen?: (file: FileSystemFileItem, url: string | null) => void;
  /** Resolve a URL (e.g. presigned) for a file without one. */
  getFileUrl?: (file: FileSystemFileItem) => string | Promise<string>;
  /** Lazily fetch children for folders with `hasChildren` and no loaded entries. */
  loadChildren?: (args: FileSystemLoadChildrenArgs) => Promise<FileSystemLoadChildrenResult>;
  /** Custom preview node for files without `previewImageUrl`. */
  renderFilePreview?: (file: FileSystemFileItem) => React.ReactNode;
  /**
   * Lazily render a page thumbnail beyond the eagerly provided
   * `previewImageUrls` (the pager calls this as pages come into view).
   */
  loadPreviewImageUrl?: (file: FileSystemFileItem, pageIndex: number) => Promise<string | null>;
};

type FolderEntry = FileSystemFolderItem & {
  name: string;
  parentPath: string;
};

type FileEntry = FileSystemFileItem & {
  key: string;
  name: string;
  parentPath: string;
};

type FileSystemEntry = FolderEntry | FileEntry;

type FileSystemIndex = {
  children: Map<string, FileSystemEntry[]>;
  files: Map<string, FileEntry>;
  folders: Map<string, FolderEntry>;
};

function normalizeFolderPath(path: string) {
  if (!path || path === "/") return "";
  return path.endsWith("/") ? path : `${path}/`;
}

function pathName(path: string) {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  const separatorIndex = trimmed.lastIndexOf("/");
  return separatorIndex === -1 ? trimmed : trimmed.slice(separatorIndex + 1);
}

function pathParent(path: string) {
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  const separatorIndex = trimmed.lastIndexOf("/");
  return separatorIndex === -1 ? "" : trimmed.slice(0, separatorIndex + 1);
}

function fileExtension(name: string) {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex === -1 ? "" : name.slice(dotIndex + 1).toLowerCase();
}

const FILE_KIND_LABELS: Record<string, string> = {
  css: "CSS Stylesheet",
  csv: "CSV Document",
  doc: "Word Document",
  docx: "Word Document",
  gif: "GIF Image",
  go: "Go Source",
  jpeg: "JPEG Image",
  jpg: "JPEG Image",
  js: "JavaScript Source",
  json: "JSON Document",
  jsx: "JavaScript Source",
  md: "Markdown Document",
  mdx: "MDX Document",
  pdf: "PDF Document",
  png: "PNG Image",
  ppt: "PowerPoint Presentation",
  pptx: "PowerPoint Presentation",
  py: "Python Script",
  rs: "Rust Source",
  sh: "Shell Script",
  sql: "SQL Script",
  svg: "SVG Image",
  ts: "TypeScript Source",
  tsv: "TSV Document",
  tsx: "TypeScript Source",
  txt: "Plain Text",
  webp: "WebP Image",
  xls: "Excel Workbook",
  xlsx: "Excel Workbook",
  yaml: "YAML Document",
  yml: "YAML Document",
  zip: "ZIP Archive",
};

function fileKindLabel(file: FileEntry) {
  const byExtension = FILE_KIND_LABELS[fileExtension(file.name)];

  if (byExtension) return byExtension;
  if (file.contentType?.startsWith("image/")) return "Image";

  return file.contentType ?? "Document";
}

// Folders sort under the "Folder" kind alphabetically among the file kinds,
// like Finder's Kind sort.
function entryKindLabel(entry: FileSystemEntry) {
  return entry.kind === "folder" ? "Folder" : fileKindLabel(entry);
}

// MIME types inferred from the extension when a file carries no
// `contentType`, so the file-type filter can classify every manifest entry.
const EXTENSION_MIME_TYPES: Record<string, string> = {
  css: "text/css",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  gif: "image/gif",
  go: "text/x-go",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsx: "text/jsx",
  md: "text/markdown",
  mdx: "text/mdx",
  pdf: "application/pdf",
  png: "image/png",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  py: "text/x-python",
  rs: "text/x-rust",
  sh: "application/x-sh",
  sql: "application/sql",
  svg: "image/svg+xml",
  ts: "text/x-typescript",
  tsv: "text/tab-separated-values",
  tsx: "text/x-typescript",
  txt: "text/plain",
  webp: "image/webp",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  yaml: "text/yaml",
  yml: "text/yaml",
  zip: "application/zip",
};

const FALLBACK_MIME_TYPE = "application/octet-stream";
const IPAD_MIN_WIDTH = 768;

const MIME_TYPE_LABELS: Record<string, string> = {
  [FALLBACK_MIME_TYPE]: "Binary",
  "application/json": "JSON",
  "application/msword": "Word document (legacy)",
  "application/pdf": "PDF",
  "application/sql": "SQL",
  "application/vnd.ms-excel": "Excel workbook (legacy)",
  "application/vnd.ms-powerpoint": "PowerPoint (legacy)",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel workbook",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word document",
  "application/x-sh": "Shell script",
  "application/zip": "ZIP archive",
  "image/gif": "GIF image",
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
  "image/svg+xml": "SVG image",
  "image/webp": "WebP image",
  "text/css": "CSS",
  "text/csv": "CSV",
  "text/javascript": "JavaScript",
  "text/jsx": "JSX",
  "text/markdown": "Markdown",
  "text/mdx": "MDX",
  "text/plain": "Plain text",
  "text/tab-separated-values": "TSV",
  "text/x-go": "Go",
  "text/x-python": "Python",
  "text/x-rust": "Rust",
  "text/x-typescript": "TypeScript",
  "text/yaml": "YAML",
};

function mimeTypeForFile(file: FileEntry) {
  return file.contentType ?? EXTENSION_MIME_TYPES[fileExtension(file.name)] ?? FALLBACK_MIME_TYPE;
}

function fileTypeFilterGroup(mime: string): FileTypeFilterGroup {
  if (
    mime === "application/pdf" ||
    mime === "application/msword" ||
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "Documents";
  }

  if (
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "text/csv" ||
    mime === "text/tab-separated-values"
  ) {
    return "Spreadsheets";
  }

  if (mime.startsWith("image/")) return "Images";

  if (
    mime === "application/json" ||
    mime === "application/sql" ||
    mime === "application/x-sh" ||
    mime === "text/css" ||
    mime === "text/javascript" ||
    mime === "text/jsx" ||
    mime === "text/x-go" ||
    mime === "text/x-python" ||
    mime === "text/x-rust" ||
    mime === "text/x-typescript" ||
    mime === "text/yaml"
  ) {
    return "Code";
  }

  if (mime === "text/markdown" || mime === "text/mdx" || mime === "text/plain") {
    return "Text";
  }

  return "Archives & binary";
}

export type FileSystemViewerKind = "csv" | "docx" | "image" | "pdf" | "xlsx";

function viewerKindForFile(file: FileSystemFileItem): FileSystemViewerKind | null {
  if (file.contentType?.startsWith("image/")) return "image";
  if (file.contentType === "application/pdf") return "pdf";

  const name = (file.name ?? file.path).toLowerCase();

  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".xlsx")) return "xlsx";
  if (/\.(avif|gif|jpe?g|png|svg|webp)$/.test(name)) return "image";
  // Local addition: CSV/TSV render with the data-grid viewer
  if (file.contentType === "text/csv" || file.contentType === "text/tab-separated-values") return "csv";
  if (name.endsWith(".csv") || name.endsWith(".tsv")) return "csv";

  return null;
}

// PDF and DOCX pages want height; spreadsheets want width; images get a
// roomy but contained frame.
const VIEWER_DIALOG_CLASSNAMES: Record<FileSystemViewerKind, string> = {
  csv: "h-[85vh] w-[min(96vw,100rem)] max-w-none",
  docx: "h-[88vh] w-[min(96vw,68rem)] max-w-none",
  image: "max-h-[88vh] w-fit max-w-[min(96vw,64rem)]",
  pdf: "h-[88vh] w-[min(96vw,68rem)] max-w-none",
  xlsx: "h-[85vh] w-[min(96vw,100rem)] max-w-none",
};

function FileSystemViewerLoading() {
  return (
    <div className="bg-background grid h-full min-h-48 flex-1 place-items-center">
      <Spinner className="text-muted-foreground size-4" />
    </div>
  );
}

function formatByteSize(size: number | undefined) {
  if (size === undefined) return null;
  if (size < 1000) return `${size} bytes`;

  const units = ["KB", "MB", "GB", "TB"];
  let value = size;

  for (const unit of units) {
    value /= 1000;
    if (value < 1000 || unit === "TB") {
      return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2).replace(/\.?0+$/, "")} ${unit}`;
    }
  }

  return null;
}

function formatTimestamp(value: string | undefined) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  const day = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${day} at ${time}`;
}

// Every directory prefix appearing in the given relative file paths.
function directoryPathsOf(paths: readonly string[]) {
  const directoryPaths = new Set<string>();

  for (const relativePath of paths) {
    let slashIndex = relativePath.indexOf("/");

    while (slashIndex !== -1) {
      directoryPaths.add(relativePath.slice(0, slashIndex));
      slashIndex = relativePath.indexOf("/", slashIndex + 1);
    }
  }
  return directoryPaths;
}

function compareEntryNames(left: { name: string }, right: { name: string }) {
  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export type FileSystemSortKey = "createdAt" | "kind" | "name" | "size" | "updatedAt";

type FileSystemSortState = {
  direction: "asc" | "desc";
  key: FileSystemSortKey;
};

const SORT_OPTIONS: Array<{
  defaultDirection: "asc" | "desc";
  key: FileSystemSortKey;
  label: string;
  /** Shorter label so the toolbar trigger stays narrow. */
  triggerLabel: string;
}> = [
  { defaultDirection: "asc", key: "name", label: "Name", triggerLabel: "Name" },
  { defaultDirection: "asc", key: "kind", label: "Kind", triggerLabel: "Kind" },
  {
    defaultDirection: "desc",
    key: "createdAt",
    label: "Date created",
    triggerLabel: "Created",
  },
  {
    defaultDirection: "desc",
    key: "updatedAt",
    label: "Date modified",
    triggerLabel: "Modified",
  },
  {
    defaultDirection: "desc",
    key: "size",
    label: "Size",
    triggerLabel: "Size",
  },
];

const DEFAULT_SORT: FileSystemSortState = { direction: "asc", key: "name" };

function defaultSortDirection(key: FileSystemSortKey) {
  return SORT_OPTIONS.find((option) => option.key === key)?.defaultDirection ?? "asc";
}

function entrySortTimestamp(entry: FileSystemEntry, key: "createdAt" | "updatedAt") {
  const value = entry[key];
  const time = value ? Date.parse(value) : Number.NaN;

  return Number.isNaN(time) ? 0 : time;
}

// Primary key per the active sort; ties (and missing metadata) fall back to
// the name order so results stay stable. The name tiebreak ignores the
// direction, like Finder.
function compareEntriesBySort(left: FileSystemEntry, right: FileSystemEntry, sort: FileSystemSortState) {
  // Local addition: folders always group before files, whatever the sort key
  if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;

  let result = 0;

  if (sort.key === "name") {
    result = compareEntryNames(left, right);
  } else if (sort.key === "kind") {
    result = entryKindLabel(left).localeCompare(entryKindLabel(right), undefined, {
      sensitivity: "base",
    });
  } else if (sort.key === "size") {
    // Folders have no byte size; group them at the small end.
    const leftSize = left.kind === "file" ? (left.size ?? 0) : -1;
    const rightSize = right.kind === "file" ? (right.size ?? 0) : -1;

    result = leftSize - rightSize;
  } else {
    result = entrySortTimestamp(left, sort.key) - entrySortTimestamp(right, sort.key);
  }

  if (result === 0) return compareEntryNames(left, right);
  return sort.direction === "asc" ? (result < 0 ? -1 : 1) : result < 0 ? 1 : -1;
}

export type FileSystemFilterType = "dateCreated" | "dateModified" | "fileType";

type FileSystemDateFilterType = Exclude<FileSystemFilterType, "fileType">;

type FileSystemFilterOperator = "after" | "before" | "in-range" | "is" | "is-any-of" | "is-not" | "not-in-range";

type FileSystemFilter = {
  id: string;
  operator: FileSystemFilterOperator;
  type: FileSystemFilterType;
  value: string[];
};

type FileTypeFilterGroup = "Documents" | "Spreadsheets" | "Images" | "Code" | "Text" | "Archives & binary";

type FileTypeFilterOption = {
  group: FileTypeFilterGroup;
  /** Sample file name so the option icon reuses the file-type sprite. */
  iconFileName: string;
  label: string;
  mime: string;
};

const FILE_TYPE_FILTER_GROUPS: FileTypeFilterGroup[] = [
  "Documents",
  "Spreadsheets",
  "Images",
  "Code",
  "Text",
  "Archives & binary",
];

const FILTER_TYPE_LABELS: Record<FileSystemFilterType, string> = {
  dateCreated: "Date created",
  dateModified: "Date modified",
  fileType: "File type",
};

const FILTER_OPERATOR_LABELS: Record<FileSystemFilterOperator, string> = {
  after: "after",
  before: "before",
  "in-range": "in range",
  is: "is",
  "is-any-of": "is any of",
  "is-not": "is not",
  "not-in-range": "not in range",
};

// Relative cutoffs for the date filters, mirroring Extend's table filters.
const DATE_FILTER_PRESETS = [
  "1 day ago",
  "3 days ago",
  "1 week ago",
  "1 month ago",
  "3 months ago",
  "6 months ago",
  "1 year ago",
];

function dateFilterPresetCutoff(preset: string) {
  const date = new Date();

  switch (preset) {
    case "1 day ago":
      date.setDate(date.getDate() - 1);
      break;
    case "3 days ago":
      date.setDate(date.getDate() - 3);
      break;
    case "1 week ago":
      date.setDate(date.getDate() - 7);
      break;
    case "1 month ago":
      date.setMonth(date.getMonth() - 1);
      break;
    case "3 months ago":
      date.setMonth(date.getMonth() - 3);
      break;
    case "6 months ago":
      date.setMonth(date.getMonth() - 6);
      break;
    case "1 year ago":
      date.setFullYear(date.getFullYear() - 1);
      break;
    default: {
      const parsed = Date.parse(preset);

      if (!Number.isNaN(parsed)) return new Date(parsed);
    }
  }
  return date;
}

// Custom ranges store two ISO timestamps instead of a relative preset.
function isCustomDateRangeValue(value: string[]) {
  return (
    value.length === 2 &&
    value.every((entry) => !DATE_FILTER_PRESETS.includes(entry) && !Number.isNaN(Date.parse(entry)))
  );
}

function filterOperatorChoices(filter: FileSystemFilter): FileSystemFilterOperator[] {
  if (filter.type === "fileType") {
    return filter.value.length > 1 ? ["is-any-of", "is-not"] : ["is", "is-not"];
  }
  if (isCustomDateRangeValue(filter.value)) return ["in-range", "not-in-range"];
  return ["before", "after"];
}

function fileMatchesFilter(file: FileEntry, filter: FileSystemFilter) {
  if (filter.value.length === 0) return true;
  if (filter.type === "fileType") {
    const matches = filter.value.includes(mimeTypeForFile(file));

    return filter.operator === "is-not" ? !matches : matches;
  }

  const timestamp = filter.type === "dateCreated" ? file.createdAt : file.updatedAt;
  const time = timestamp ? Date.parse(timestamp) : Number.NaN;

  if (Number.isNaN(time)) return false;
  if (filter.operator === "in-range" || filter.operator === "not-in-range") {
    const from = Date.parse(filter.value[0]);
    const to = Date.parse(filter.value[1] ?? filter.value[0]);
    const isInRange = time >= from && time <= to;

    return filter.operator === "not-in-range" ? !isInRange : isInRange;
  }

  const cutoff = dateFilterPresetCutoff(filter.value[0]).getTime();

  return filter.operator === "before" ? time <= cutoff : time >= cutoff;
}

function buildFileSystemIndex(items: FileSystemItem[]): FileSystemIndex {
  const folders = new Map<string, FolderEntry>();
  const files = new Map<string, FileEntry>();

  const ensureFolderChain = (folderPath: string) => {
    let path = normalizeFolderPath(folderPath);

    while (path && !folders.has(path)) {
      folders.set(path, {
        kind: "folder",
        name: pathName(path),
        parentPath: pathParent(path),
        path,
      });
      path = pathParent(path);
    }
  };

  for (const item of items) {
    if (item.kind === "folder") {
      const path = normalizeFolderPath(item.path);

      if (!path) continue;

      folders.set(path, {
        ...item,
        name: item.name ?? pathName(path),
        parentPath: normalizeFolderPath(item.parentPath ?? pathParent(path)),
        path,
      });
      ensureFolderChain(pathParent(path));
    } else {
      if (!item.path) continue;

      files.set(item.path, {
        ...item,
        key: item.key ?? item.path,
        name: item.name ?? pathName(item.path),
        parentPath: normalizeFolderPath(item.parentPath ?? pathParent(item.path)),
      });
      ensureFolderChain(pathParent(item.path));
    }
  }

  const children = new Map<string, FileSystemEntry[]>();
  const pushChild = (entry: FileSystemEntry) => {
    const siblings = children.get(entry.parentPath);

    if (siblings) {
      siblings.push(entry);
    } else {
      children.set(entry.parentPath, [entry]);
    }
  };

  for (const folder of folders.values()) pushChild(folder);
  for (const file of files.values()) pushChild(file);
  for (const siblings of children.values()) {
    siblings.sort(compareEntryNames);
  }

  // Folders without an explicit modified date inherit their newest child's —
  // object stores carry no folder metadata, yet the list view shows the
  // column and the date sorts compare it. Deepest first (a descendant's path
  // is always longer than its ancestor's) so dates propagate up the chain.
  const foldersDeepestFirst = [...folders.values()].sort((left, right) => right.path.length - left.path.length);

  for (const folder of foldersDeepestFirst) {
    if (folder.updatedAt) continue;

    let newestTime = Number.NEGATIVE_INFINITY;
    let newestValue: string | undefined;

    for (const child of children.get(folder.path) ?? []) {
      const value = child.updatedAt ?? child.createdAt;
      const time = value ? Date.parse(value) : Number.NaN;

      if (!Number.isNaN(time) && time > newestTime) {
        newestTime = time;
        newestValue = value;
      }
    }
    if (newestValue) folder.updatedAt = newestValue;
  }

  return { children, files, folders };
}

function folderHasChildren(index: FileSystemIndex, folder: FolderEntry) {
  return (index.children.get(folder.path)?.length ?? 0) > 0 || folder.hasChildren === true;
}

// A single SVG source so the same glyph renders as a React element, inside the
// @pierre/trees shadow DOM (via CSS url()), and stays pixel-identical in both.
const FOLDER_GLYPH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 50" width="64" height="50"><defs><linearGradient id="fs-folder-back" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3dabf5"/><stop offset="1" stop-color="#1d84dd"/></linearGradient><linearGradient id="fs-folder-front" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7accfb"/><stop offset="1" stop-color="#37a0ef"/></linearGradient></defs><path d="M5 10c0-3.31 2.69-6 6-6h10.9c1.6 0 3.13.7 4.18 1.9l1.5 1.73a3.5 3.5 0 0 0 2.64 1.22H54c2.76 0 5 2.24 5 5V40c0 3.87-3.13 7-7 7H12c-3.87 0-7-3.13-7-7V10Z" fill="url(#fs-folder-back)"/><path d="M5 15.5h54V40c0 3.87-3.13 7-7 7H12c-3.87 0-7-3.13-7-7V15.5Z" fill="url(#fs-folder-front)"/></svg>`;

const FOLDER_GLYPH_DATA_URL = `data:image/svg+xml,${encodeURIComponent(FOLDER_GLYPH_SVG)}`;

function FileSystemFolderGlyph({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- The folder glyph is an inline SVG data URL shared with the tree sprite.
    <img src={FOLDER_GLYPH_DATA_URL} alt="" aria-hidden="true" draggable={false} className={className} />
  );
}

function escapeXmlAttribute(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

// The @pierre/trees "complete" set — the full, colored suite with brand and
// framework glyphs — ships as an SVG sprite. The list view tree consumes it
// natively inside its shadow DOM; the icon, column, and gallery views render
// the same sprite from the light DOM so every view falls back to the same
// file-type icon when a file has no thumbnail.
const FILE_ICON_SPRITE_SHEET = getBuiltInSpriteSheet("complete");

const { resolveIcon: resolveFileIcon } = createFileTreeIconResolver({
  colored: true,
  set: "complete",
});

// Per-token light/dark colors mirroring the palette the tree applies inside
// its shadow DOM. Tokens without an entry (font, nextjs, stylelint) stay
// muted-foreground there too.
const FILE_ICON_COLORS: Record<string, [light: string, dark: string]> = {
  astro: ["#a631be", "#d568ea"],
  babel: ["#d5a910", "#ffd452"],
  bash: ["#199f43", "#5ecc71"],
  biome: ["#1a85d4", "#69b1ff"],
  bootstrap: ["#693acf", "#9d6afb"],
  browserslist: ["#d5a910", "#ffd452"],
  bun: ["#594c5b", "#79697b"],
  c: ["#1a85d4", "#69b1ff"],
  claude: ["#d47628", "#ffa359"],
  cpp: ["#1a85d4", "#69b1ff"],
  css: ["#693acf", "#9d6afb"],
  database: ["#a631be", "#d568ea"],
  default: ["#84848a", "#adadb1"],
  docker: ["#1a85d4", "#69b1ff"],
  eslint: ["#693acf", "#9d6afb"],
  git: ["#ff8c5b", "#d5512f"],
  go: ["#1ca1c7", "#68cdf2"],
  graphql: ["#d32a61", "#ff678d"],
  html: ["#d47628", "#ffa359"],
  image: ["#d32a61", "#ff678d"],
  javascript: ["#d5a910", "#ffd452"],
  json: ["#d47628", "#ffa359"],
  markdown: ["#199f43", "#5ecc71"],
  mcp: ["#17a5af", "#64d1db"],
  npm: ["#d52c36", "#ff6762"],
  oxc: ["#1ca1c7", "#68cdf2"],
  postcss: ["#d52c36", "#ff6762"],
  prettier: ["#17a5af", "#64d1db"],
  python: ["#1a85d4", "#69b1ff"],
  react: ["#1ca1c7", "#68cdf2"],
  ruby: ["#d52c36", "#ff6762"],
  rust: ["#d47628", "#ffa359"],
  sass: ["#d32a61", "#ff678d"],
  svelte: ["#d52c36", "#ff6762"],
  svg: ["#d47628", "#ffa359"],
  svgo: ["#199f43", "#5ecc71"],
  swift: ["#d47628", "#ffa359"],
  table: ["#17a5af", "#64d1db"],
  tailwind: ["#1ca1c7", "#68cdf2"],
  terraform: ["#693acf", "#9d6afb"],
  text: ["#84848a", "#adadb1"],
  typescript: ["#1a85d4", "#69b1ff"],
  vite: ["#a631be", "#d568ea"],
  vscode: ["#1a85d4", "#69b1ff"],
  vue: ["#199f43", "#5ecc71"],
  wasm: ["#693acf", "#9d6afb"],
  webpack: ["#1a85d4", "#69b1ff"],
  yml: ["#d52c36", "#ff6762"],
  zig: ["#d47628", "#ffa359"],
  zip: ["#d47628", "#ffa359"],
};

function fileIconColorVariables(mode: 0 | 1) {
  return Object.entries(FILE_ICON_COLORS)
    .map(([token, colors]) => `--fs-file-icon-${token}: ${colors[mode]};`)
    .join(" ");
}

// The variables live on :root rather than the component root because the
// filter menus and dialogs portal outside it; the --fs-file-icon-*
// namespace keeps them collision-free. Thumbnail tiles keep a light
// (paper) surface in dark mode, so icons inside them revert to the light
// palette ([data-file-system-on-light]); selected rows sit on the primary
// surface — the opposite of the mode's background — so icons there swap to
// the opposite palette ([data-file-system-on-primary] in the light DOM,
// --fs-selected-color-scheme for the tree's light-dark() colors inside its
// shadow DOM).
const FILE_ICON_COLOR_CSS = `
:root { ${fileIconColorVariables(0)} --fs-selected-color-scheme: dark; }
.dark { ${fileIconColorVariables(1)} --fs-selected-color-scheme: light; }
.dark [data-file-system-on-light] { ${fileIconColorVariables(0)} }
[data-file-system-on-primary] { ${fileIconColorVariables(1)} }
.dark [data-file-system-on-primary] { ${fileIconColorVariables(0)} }
`;

function FileSystemIconSpriteSheet() {
  return (
    <>
      <span aria-hidden="true" className="hidden" dangerouslySetInnerHTML={{ __html: FILE_ICON_SPRITE_SHEET }} />
      <style>{FILE_ICON_COLOR_CSS}</style>
    </>
  );
}

function FileTypeIcon({ fileName, className }: { fileName: string; className?: string }) {
  const icon = resolveFileIcon("file-tree-icon-file", fileName);

  return (
    <svg
      aria-hidden="true"
      viewBox={icon.viewBox ?? "0 0 16 16"}
      className={cn("text-muted-foreground shrink-0", className)}
      style={
        icon.token
          ? {
              color: `var(--fs-file-icon-${icon.token}, var(--color-muted-foreground))`,
            }
          : undefined
      }
    >
      <use href={`#${icon.name}`} />
    </svg>
  );
}

function FileGenericPreview({ file }: { file: FileEntry }) {
  const extension = fileExtension(file.name);

  return (
    <div
      data-file-system-on-light=""
      className="text-neutral-400 dark:bg-neutral-100 flex size-full flex-col items-center justify-center gap-1.5 bg-white"
    >
      <FileTypeIcon fileName={file.name} className="size-1/3 min-h-4 min-w-4" />
      {extension ? (
        <span className="text-[min(0.625rem,18cqw)] font-semibold tracking-wide uppercase">{extension}</span>
      ) : null}
    </div>
  );
}

function filePreviewUrls(file: FileSystemFileItem) {
  if (file.previewImageUrls?.length) return file.previewImageUrls;
  return file.previewImageUrl ? [file.previewImageUrl] : [];
}

// Mirrors @pierre/trees' query normalization so the toolbar search filters
// the icon, column, and gallery views exactly like the list view tree:
// trimmed, backslashes to slashes, lowercased, substring match on the path.
function normalizeSearchQuery(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  return trimmed.replaceAll("\\", "/").toLowerCase();
}

// Windowed rendering, the approach @pierre/trees uses for the list view:
// with a fixed item stride only the items intersecting the viewport — plus
// `overscan` on each side — are mounted, so views stay flat-cost at
// thousands of entries. The window keeps a one-item margin before
// recomputing (scrolling doesn't re-render per item) and that margin also
// guarantees single-step keyboard moves land on a mounted neighbor.
function useVirtualWindow({
  count,
  horizontal = false,
  itemStride,
  leadingPx = 0,
  overscan = 8,
  viewportRef,
}: {
  count: number;
  horizontal?: boolean;
  itemStride: number;
  leadingPx?: number;
  overscan?: number;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [window_, setWindow] = React.useState(() => ({
    end: Math.min(count, overscan * 2),
    start: 0,
  }));

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || itemStride <= 0) return;

    const update = () => {
      const scrollStart = (horizontal ? viewport.scrollLeft : viewport.scrollTop) - leadingPx;
      const viewportSize = horizontal ? viewport.clientWidth : viewport.clientHeight;
      const firstVisible = Math.max(0, Math.floor(scrollStart / itemStride));
      const lastVisible = Math.min(count, Math.ceil((scrollStart + viewportSize) / itemStride));

      setWindow((previous) => {
        if (
          previous.end <= count &&
          previous.start <= Math.max(0, firstVisible - 1) &&
          previous.end >= Math.min(count, lastVisible + 1)
        ) {
          return previous;
        }
        return {
          end: Math.min(count, lastVisible + overscan),
          start: Math.max(0, firstVisible - overscan),
        };
      });
    };

    update();
    viewport.addEventListener("scroll", update, { passive: true });

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);

    observer?.observe(viewport);
    return () => {
      viewport.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [count, horizontal, itemStride, leadingPx, overscan, viewportRef]);

  return window_;
}

// Scrolls the item at `index` into the viewport when it sits outside it —
// virtualized views need this because off-window items have no DOM node to
// call scrollIntoView on.
function scrollIndexIntoView({
  horizontal = false,
  index,
  itemSize,
  itemStride,
  leadingPx = 0,
  viewport,
}: {
  horizontal?: boolean;
  index: number;
  itemSize: number;
  itemStride: number;
  leadingPx?: number;
  viewport: HTMLDivElement | null;
}) {
  if (!viewport || index < 0) return;

  const start = leadingPx + index * itemStride;
  const end = start + itemSize;
  const scrollStart = horizontal ? viewport.scrollLeft : viewport.scrollTop;
  const viewportSize = horizontal ? viewport.clientWidth : viewport.clientHeight;

  let nextScrollStart: number | null = null;

  if (start < scrollStart) {
    nextScrollStart = start;
  } else if (end > scrollStart + viewportSize) {
    nextScrollStart = end - viewportSize;
  }
  if (nextScrollStart === null) return;
  if (horizontal) {
    viewport.scrollLeft = nextScrollStart;
  } else {
    viewport.scrollTop = nextScrollStart;
  }
}

function FileVisual({
  file,
  className,
  loadPreviewImageUrl,
  pageable = false,
  pageUrlCache,
  previewAspectRatio,
  previewClassName,
  renderFilePreview,
}: {
  file: FileEntry;
  className?: string;
  loadPreviewImageUrl?: (file: FileSystemFileItem, pageIndex: number) => Promise<string | null>;
  /** Show a hover pager over multi-page thumbnails. */
  pageable?: boolean;
  /**
   * Shared `"path#pageIndex"` → URL cache so pages fetched by one pager
   * (gallery stage, columns preview) are reused by every other instance.
   */
  pageUrlCache?: Map<string, string>;
  previewAspectRatio?: number;
  previewClassName?: string;
  renderFilePreview?: (file: FileSystemFileItem) => React.ReactNode;
}) {
  const previewUrls = filePreviewUrls(file);
  const canLoadLazily = pageable && Boolean(loadPreviewImageUrl);
  const totalPages = Math.max(previewUrls.length, canLoadLazily ? (file.previewPageCount ?? 0) : 0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [lazyPageUrls, setLazyPageUrls] = React.useState<Record<number, string>>({});
  const clampedPageIndex = Math.min(pageIndex, Math.max(totalPages - 1, 0));
  const previewUrl =
    previewUrls[clampedPageIndex] ??
    lazyPageUrls[clampedPageIndex] ??
    pageUrlCache?.get(`${file.path}#${clampedPageIndex}`) ??
    null;
  const resolvedAspectRatio = file.previewAspectRatio ?? previewAspectRatio;
  const isLazyPagePending = canLoadLazily && !previewUrl && clampedPageIndex < totalPages;

  const fileRef = React.useRef(file);

  React.useEffect(() => {
    fileRef.current = file;
  });

  React.useEffect(() => {
    setPageIndex(0);
    setLazyPageUrls({});
  }, [file.path]);

  // Keyed by path (not object identity) so manifest churn doesn't re-request
  // the page already being loaded.
  React.useEffect(() => {
    if (!isLazyPagePending || !loadPreviewImageUrl) return;

    let isCurrent = true;

    void loadPreviewImageUrl(fileRef.current, clampedPageIndex)
      .then((url) => {
        // Cache even when stale (page flipped away mid-load): the fetch is
        // done, so let the next visit use it.
        if (url) pageUrlCache?.set(`${file.path}#${clampedPageIndex}`, url);
        if (isCurrent && url) {
          setLazyPageUrls((previous) => ({
            ...previous,
            [clampedPageIndex]: url,
          }));
        }
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [clampedPageIndex, file.path, isLazyPagePending, loadPreviewImageUrl, pageUrlCache]);

  const customPreview = !previewUrl && !isLazyPagePending ? renderFilePreview?.(file) : null;
  const showPager = pageable && totalPages > 1;
  const thumbnail = (
    <FileThumbnail
      file={{ name: file.name, type: file.contentType ?? "" }}
      className={cn("@container", !showPager && className)}
      previewAspectRatio={resolvedAspectRatio}
      previewClassName={cn("dark:bg-neutral-100 bg-white", previewClassName)}
      previewImageUrl={previewUrl ?? undefined}
      isLoading={isLazyPagePending}
      previewContent={
        previewUrl || isLazyPagePending ? undefined : (customPreview ?? <FileGenericPreview file={file} />)
      }
    />
  );

  if (!showPager) return thumbnail;

  return (
    <div className={cn("group/pager relative", className)}>
      {thumbnail}
      <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1 opacity-0 transition-opacity group-focus-within/pager:opacity-100 group-hover/pager:opacity-100">
        <button
          type="button"
          aria-label="Previous page"
          tabIndex={-1}
          disabled={clampedPageIndex === 0}
          onClick={(event) => {
            event.stopPropagation();
            setPageIndex((previous) => Math.max(0, previous - 1));
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="bg-background/80 text-foreground shadow-xs hover:bg-background focus-visible:ring-ring flex size-6 items-center justify-center rounded-md backdrop-blur-sm transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
        </button>
        <span className="bg-background/80 text-muted-foreground shadow-xs rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums backdrop-blur-sm">
          {clampedPageIndex + 1}/{totalPages}
        </span>
        <button
          type="button"
          aria-label="Next page"
          tabIndex={-1}
          disabled={clampedPageIndex >= totalPages - 1}
          onClick={(event) => {
            event.stopPropagation();
            setPageIndex((previous) => Math.min(totalPages - 1, previous + 1));
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          className="bg-background/80 text-foreground shadow-xs hover:bg-background focus-visible:ring-ring flex size-6 items-center justify-center rounded-md backdrop-blur-sm transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

const VIEW_OPTIONS: Array<{
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  label: string;
  value: FileSystemView;
}> = [
  { icon: GridViewIcon, label: "Grid", value: "icons" },
  { icon: LeftToRightListBulletIcon, label: "List", value: "list" },
  { icon: LayoutThreeColumnIcon, label: "Columns", value: "columns" },
  { icon: GalleryThumbnailsIcon, label: "Gallery", value: "gallery" },
];

export function FileSystem({
  items,
  className,
  title = "Files",
  defaultView = "icons",
  view: viewProp,
  onViewChange,
  defaultPath = "",
  onPathChange,
  hideToolbarControls = false,
  sortOverride,
  onSelectionChange,
  onFileOpen,
  getFileUrl,
  loadChildren,
  loadPreviewImageUrl,
  renderFilePreview,
}: FileSystemProps) {
  const [internalView, setInternalView] = React.useState(defaultView);
  const view = viewProp ?? internalView;
  const setView = React.useCallback(
    (nextView: FileSystemView) => {
      setInternalView(nextView);
      onViewChange?.(nextView);
    },
    [onViewChange]
  );

  const [loadedItems, setLoadedItems] = React.useState<FileSystemItem[]>([]);
  const allItems = React.useMemo(() => (loadedItems.length ? [...items, ...loadedItems] : items), [items, loadedItems]);
  const index = React.useMemo(() => buildFileSystemIndex(allItems), [allItems]);

  const [history, setHistory] = React.useState(() => ({
    index: 0,
    stack: [normalizeFolderPath(defaultPath)],
  }));
  const currentPath = history.stack[history.index] ?? "";
  const canGoBack = history.index > 0;
  const canGoForward = history.index < history.stack.length - 1;

  // Local addition: surface navigation to the host app (breadcrumbs etc.)
  React.useEffect(() => {
    onPathChange?.(currentPath);
  }, [currentPath, onPathChange]);

  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const selectedEntry = React.useMemo(() => {
    if (selectedPath === null) return null;

    return index.files.get(selectedPath) ?? index.folders.get(selectedPath) ?? null;
  }, [index, selectedPath]);

  const [searchInput, setSearchInput] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchQuery = normalizeSearchQuery(searchInput);
  const isSearching = searchQuery.length > 0;

  const [internalSort, setSort] = React.useState(DEFAULT_SORT);
  // Local addition: the host can drive the sort (e.g. mirroring a DB order)
  const sort = sortOverride ?? internalSort;
  const [filters, setFilters] = React.useState<FileSystemFilter[]>([]);
  const hasActiveFilters = filters.length > 0;

  // Files must pass every active filter; folders stay visible through
  // matching descendants, so the predicate only ever sees files.
  const fileFilter = React.useMemo(() => {
    if (filters.length === 0) return null;
    return (file: FileEntry) => filters.every((filter) => fileMatchesFilter(file, filter));
  }, [filters]);

  // Paths that stay visible while searching or filtering: every file whose
  // currentPath-relative path contains the query — the list view tree's
  // hide-non-matches semantics — and that passes the filters, plus the
  // ancestor folders leading to it. Folder names participate in search
  // matches only when no filters are active; with filters, a folder is only
  // as visible as the files inside it.
  const visiblePaths = React.useMemo(() => {
    if (!isSearching && !fileFilter) return null;

    const visible = new Set<string>();
    const markVisible = (path: string) => {
      while (path && path !== currentPath && !visible.has(path)) {
        visible.add(path);
        path = pathParent(path);
      }
    };
    const matchesQuery = (path: string) =>
      !isSearching || path.slice(currentPath.length).toLowerCase().includes(searchQuery);

    for (const [path, file] of index.files) {
      if (path === currentPath) continue;
      if (currentPath && !path.startsWith(currentPath)) continue;
      if (!matchesQuery(path)) continue;
      if (fileFilter && !fileFilter(file)) continue;
      markVisible(path);
    }
    if (!fileFilter) {
      for (const path of index.folders.keys()) {
        if (path === currentPath) continue;
        if (currentPath && !path.startsWith(currentPath)) continue;
        if (matchesQuery(path)) markVisible(path);
      }
    }
    return visible;
  }, [currentPath, fileFilter, index, isSearching, searchQuery]);

  const visibleIndex = React.useMemo(() => {
    if (!visiblePaths) return index;

    const children = new Map<string, FileSystemEntry[]>();

    for (const [parentPath, parentChildren] of index.children) {
      const visibleChildren = parentChildren.filter((entry) => visiblePaths.has(entry.path));

      if (visibleChildren.length) children.set(parentPath, visibleChildren);
    }
    return { ...index, children };
  }, [index, visiblePaths]);

  // Children re-sorted per the active sort; the default (name ascending)
  // reuses the index's pre-sorted arrays untouched.
  const sortedIndex = React.useMemo(() => {
    if (sort.key === DEFAULT_SORT.key && sort.direction === DEFAULT_SORT.direction) {
      return visibleIndex;
    }

    const children = new Map<string, FileSystemEntry[]>();

    for (const [parentPath, parentChildren] of visibleIndex.children) {
      children.set(
        parentPath,
        [...parentChildren].sort((left, right) => compareEntriesBySort(left, right, sort))
      );
    }
    return { ...visibleIndex, children };
  }, [sort, visibleIndex]);

  // The ref mirrors the state so re-selecting the same entry (e.g. the
  // pointerdown + click pair the columns view emits per press) stays a
  // no-op without widening the callback's dependencies.
  const selectedPathRef = React.useRef<string | null>(null);
  const selectEntry = React.useCallback(
    (entry: FileSystemEntry | null) => {
      const path = entry?.path ?? null;

      if (selectedPathRef.current === path) return;
      selectedPathRef.current = path;
      setSelectedPath(path);
      onSelectionChange?.(entry);
    },
    [onSelectionChange]
  );

  // A query or filter change can hide the selected entry out from under the
  // views.
  React.useEffect(() => {
    if (!visiblePaths || !selectedPath) return;
    if (!visiblePaths.has(selectedPath)) selectEntry(null);
  }, [selectEntry, selectedPath, visiblePaths]);

  const applySortKey = React.useCallback((key: FileSystemSortKey) => {
    setSort((previous) => (previous.key === key ? previous : { direction: defaultSortDirection(key), key }));
  }, []);

  // Column headers toggle the direction when the column is already active,
  // like Finder.
  const toggleSortColumn = React.useCallback((key: FileSystemSortKey) => {
    setSort((previous) =>
      previous.key === key
        ? { direction: previous.direction === "asc" ? "desc" : "asc", key }
        : { direction: defaultSortDirection(key), key }
    );
  }, []);

  // Distinct MIME types across the loaded manifest, labeled for the filter
  // menu; the first file seen per type lends its name to the option icon.
  const fileTypeOptions = React.useMemo(() => {
    const byMime = new Map<string, FileTypeFilterOption>();

    for (const file of index.files.values()) {
      const mime = mimeTypeForFile(file);

      if (!byMime.has(mime)) {
        // The leading-dot check keeps dotfiles (.gitignore) whole.
        const dotIndex = file.name.lastIndexOf(".");
        const extension = dotIndex > 0 ? file.name.slice(dotIndex + 1).toLowerCase() : "";

        byMime.set(mime, {
          group: fileTypeFilterGroup(mime),
          // A synthesized generic name, so files with branded icons
          // (biome.json, next.config.ts, CLAUDE.md, …) don't lend them to
          // the whole type; extensionless names keep their own icon
          // (Dockerfile, Makefile).
          iconFileName: extension ? `file.${extension}` : file.name,
          label: MIME_TYPE_LABELS[mime] ?? mime,
          mime,
        });
      }
    }
    return [...byMime.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [index]);

  const filterIdRef = React.useRef(0);
  const [dateRangeDialog, setDateRangeDialog] = React.useState<{
    initialRange?: { from: Date; to: Date };
    type: FileSystemDateFilterType;
  } | null>(null);

  const toggleFileTypeFilterValue = React.useCallback((mime: string, checked: boolean) => {
    const id = `filter-${++filterIdRef.current}`;

    setFilters((previous) => {
      const existing = previous.find((filter) => filter.type === "fileType");

      if (!existing) {
        if (!checked) return previous;
        return [
          ...previous,
          {
            id,
            operator: "is" as const,
            type: "fileType" as const,
            value: [mime],
          },
        ];
      }

      const value = checked
        ? [...new Set([...existing.value, mime])]
        : existing.value.filter((entry) => entry !== mime);

      if (value.length === 0) {
        return previous.filter((filter) => filter !== existing);
      }

      // "is" and "is any of" track the value count; "is not" is unaffected.
      const operator =
        existing.operator === "is" || existing.operator === "is-any-of"
          ? value.length > 1
            ? ("is-any-of" as const)
            : ("is" as const)
          : existing.operator;

      return previous.map((filter) => (filter === existing ? { ...filter, operator, value } : filter));
    });
  }, []);

  const setDatePresetFilter = React.useCallback((type: FileSystemDateFilterType, preset: string) => {
    const id = `filter-${++filterIdRef.current}`;

    setFilters((previous) => [
      ...previous.filter((filter) => filter.type !== type),
      { id, operator: "after", type, value: [preset] },
    ]);
  }, []);

  // Editing an existing custom range seeds the dialog with its bounds.
  const openDateRangeDialog = React.useCallback(
    (type: FileSystemDateFilterType) => {
      const existing = filters.find((filter) => filter.type === type);

      setDateRangeDialog({
        initialRange:
          existing && isCustomDateRangeValue(existing.value)
            ? {
                from: new Date(existing.value[0]),
                to: new Date(existing.value[1]),
              }
            : undefined,
        type,
      });
    },
    [filters]
  );

  const applyCustomDateRange = React.useCallback((type: FileSystemDateFilterType, from: Date, to: Date) => {
    const id = `filter-${++filterIdRef.current}`;

    setFilters((previous) => {
      const existing = previous.find((filter) => filter.type === type);

      return [
        ...previous.filter((filter) => filter.type !== type),
        {
          id,
          operator: existing?.operator === "not-in-range" ? ("not-in-range" as const) : ("in-range" as const),
          type,
          value: [from.toISOString(), to.toISOString()],
        },
      ];
    });
  }, []);

  // Below iPad width the view switcher collapses into a select and the sort
  // select drops its label; below 560px the search input collapses into a
  // popover, and below 360px the folder name is dropped too.
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [headerLayout, setHeaderLayout] = React.useState<"full" | "compact" | "minimal">("full");
  const [isBelowIpadWidth, setIsBelowIpadWidth] = React.useState(false);

  React.useEffect(() => {
    const root = rootRef.current;

    if (!root || typeof ResizeObserver === "undefined") return;

    const applyWidth = (width: number | undefined) => {
      if (width === undefined) return;

      setHeaderLayout(width < 360 ? "minimal" : width < 560 ? "compact" : "full");
      setIsBelowIpadWidth(width < IPAD_MIN_WIDTH);
    };
    const observer = new ResizeObserver((observerEntries) => applyWidth(observerEntries[0]?.contentRect.width));

    // Measure synchronously so the first painted layout is already correct;
    // the observer then tracks resizes.
    applyWidth(root.clientWidth);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const requestedFoldersRef = React.useRef(new Set<string>());
  const [loadingFolders, setLoadingFolders] = React.useState<Set<string>>(() => new Set());
  const ensureChildren = React.useCallback(
    (folderPath: string) => {
      if (!loadChildren) return;

      const folder = index.folders.get(folderPath);

      if (!folder?.hasChildren) return;
      if (index.children.get(folderPath)?.length) return;
      if (requestedFoldersRef.current.has(folderPath)) return;

      requestedFoldersRef.current.add(folderPath);
      setLoadingFolders((previous) => new Set(previous).add(folderPath));

      void (async () => {
        try {
          let cursor: string | null = null;

          do {
            const result = await loadChildren({ cursor, path: folderPath });

            if (result.items.length) {
              setLoadedItems((previous) => [...previous, ...result.items]);
            }
            cursor = result.nextCursor ?? null;
          } while (cursor);
        } catch {
          requestedFoldersRef.current.delete(folderPath);
        } finally {
          setLoadingFolders((previous) => {
            const next = new Set(previous);

            next.delete(folderPath);
            return next;
          });
        }
      })();
    },
    [index, loadChildren]
  );

  const navigateTo = React.useCallback(
    (folderPath: string) => {
      const path = normalizeFolderPath(folderPath);

      setHistory((previous) => {
        if (previous.stack[previous.index] === path) return previous;

        const stack = [...previous.stack.slice(0, previous.index + 1), path];

        return { index: stack.length - 1, stack };
      });
      // Navigation exits search, like Finder.
      setSearchInput("");
      selectEntry(null);
      ensureChildren(path);
    },
    [ensureChildren, selectEntry]
  );

  React.useEffect(() => {
    ensureChildren(currentPath);
  }, [currentPath, ensureChildren]);

  // Navigation unmounts the focused row, dropping focus to <body> and killing
  // the ⌘ shortcuts; reclaim focus onto the component root when that happens.
  const previousPathRef = React.useRef(currentPath);

  React.useEffect(() => {
    if (previousPathRef.current === currentPath) {
      return;
    }

    previousPathRef.current = currentPath;
    const root = rootRef.current;

    if (root && document.activeElement === document.body) {
      root.focus({ preventScroll: true });
    }
  }, [currentPath]);

  const [openedFile, setOpenedFile] = React.useState<{
    file: FileEntry;
    kind: FileSystemViewerKind;
    url: string;
  } | null>(null);

  // Component-lifetime caches shared by every view and the open dialog:
  // resolved (e.g. presigned) URLs keyed by path, and lazily loaded page
  // thumbnails keyed by `"path#pageIndex"`. Each resolution happens once no
  // matter how often the user revisits a file or switches views; stable
  // URLs also keep the browser's HTTP cache valid for fetched content.
  // Lazy state (never set) rather than refs: the Maps are passed down
  // during render, which the rules of React disallow for ref reads.
  const [resolvedUrlCache] = React.useState(() => new Map<string, string>());
  const [pageUrlCache] = React.useState(() => new Map<string, string>());

  // The keep-alive preview pool. Recently shown documents stay mounted so
  // returning to one — in the gallery stage or the viewer dialog — skips
  // the download and parse work instead of repeating it behind a spinner.
  // Each pooled path renders through a portal into a stable detached <div>
  // created once per path and never swapped (React remounts a portal's
  // children when its container changes); a layout effect reparents that
  // div into whichever host currently shows the file: the gallery's stage
  // wrapper or the open dialog. Imperative appendChild keeps the mounted
  // viewer (and its parsed document) alive across every move. Pooled paths
  // without a current host stay mounted but DETACHED from the DOM — a
  // detached subtree costs no layout, paint, or style-recalc work, so idle
  // pool members never slow down interactions in the visible viewer.
  const [stagePool, setStagePool] = React.useState<string[]>([]);
  const [stageRecency] = React.useState(() => new Map<string, number>());
  const stageClockRef = React.useRef(0);
  const [stageContainers] = React.useState(() => new Map<string, HTMLDivElement>());
  const [stageHosts] = React.useState(() => new Map<string, HTMLElement>());
  const [, bumpStageHosts] = React.useState(0);
  // Bumped on every admission so the attach set recomputes when recency
  // changes without a pool membership change.
  const [stageVersion, setStageVersion] = React.useState(0);
  const [dialogStageHost, setDialogStageHost] = React.useState<HTMLElement | null>(null);

  const registerStageHost = React.useCallback(
    (path: string, element: HTMLElement | null) => {
      if (element) {
        if (stageHosts.get(path) === element) return;
        stageHosts.set(path, element);
      } else {
        if (!stageHosts.has(path)) return;
        stageHosts.delete(path);
      }
      bumpStageHosts((version) => version + 1);
    },
    [stageHosts]
  );

  const dialogStageHostRef = React.useCallback((element: HTMLDivElement | null) => setDialogStageHost(element), []);

  // Admits a file into the pool (idempotent), evicting the least recently
  // admitted path beyond the cap. The pool array keeps insertion order —
  // reordering would churn the host registrations — so recency lives in a
  // separate map; the version bump re-renders so the attach set below
  // tracks recency even when pool membership is unchanged.
  const poolStagePath = React.useCallback(
    (path: string) => {
      if (!index.files.has(path)) return;
      if (!stageContainers.has(path)) {
        const container = document.createElement("div");

        // Layout/paint containment keeps work inside one preview from
        // invalidating the rest of the page (and vice versa).
        container.className = "flex size-full min-h-0 min-w-0 items-center justify-center contain-layout contain-paint";
        stageContainers.set(path, container);
      }

      stageRecency.set(path, ++stageClockRef.current);
      setStageVersion((version) => version + 1);
      setStagePool((previous) => {
        if (previous.includes(path)) return previous;

        const next = [...previous, path];

        if (next.length <= GALLERY_STAGE_POOL_SIZE) return next;

        let evicted = next[0];

        for (const candidate of next) {
          if (candidate === path) continue;
          if ((stageRecency.get(candidate) ?? 0) < (stageRecency.get(evicted) ?? 0)) {
            evicted = candidate;
          }
        }
        return next.filter((candidate) => candidate !== evicted);
      });
    },
    [index, stageContainers, stageRecency]
  );

  const dialogStagePath = openedFile !== null && openedFile.kind !== "image" ? openedFile.file.path : null;
  // Only the most recently shown stages stay attached to the DOM, so
  // rotating among a few files stays instant while older pool members wait
  // detached at zero rendering cost. Memoized so host ref callbacks
  // downstream stay referentially stable — recomputing every render would
  // re-register hosts in a loop.
  const attachedStagePaths = React.useMemo(() => {
    void stageVersion;

    const attached = [...stagePool]
      .sort((a, b) => (stageRecency.get(b) ?? 0) - (stageRecency.get(a) ?? 0))
      .slice(0, GALLERY_STAGE_ATTACHED_COUNT);

    if (dialogStagePath && stagePool.includes(dialogStagePath) && !attached.includes(dialogStagePath)) {
      attached.push(dialogStagePath);
    }
    return attached;
  }, [dialogStagePath, stagePool, stageRecency, stageVersion]);

  // Reparent each pooled container to its current host. No dependency
  // array: host registration mutates maps in place, so the cheap loop
  // (pool ≤ GALLERY_STAGE_POOL_SIZE) runs every commit instead of chasing
  // every mutation source.
  React.useLayoutEffect(() => {
    for (const [path, container] of stageContainers) {
      if (!stagePool.includes(path)) {
        // Evicted — React already unmounted the portal's children.
        container.remove();
        stageContainers.delete(path);
        continue;
      }
      if (dialogStagePath === path) {
        // Leave the container in place until the dialog host mounts.
        if (dialogStageHost && container.parentElement !== dialogStageHost) {
          dialogStageHost.appendChild(container);
        }
        continue;
      }

      const target = attachedStagePaths.includes(path) ? (stageHosts.get(path) ?? null) : null;

      if (!target) {
        if (container.parentElement) container.remove();
      } else if (container.parentElement !== target) {
        target.appendChild(container);
      }
    }
  });

  const openFile = React.useCallback(
    (file: FileEntry) => {
      void (async () => {
        let url = file.url ?? resolvedUrlCache.get(file.path) ?? null;

        if (!url && getFileUrl) {
          try {
            url = await getFileUrl(file);
            if (url) resolvedUrlCache.set(file.path, url);
          } catch {
            url = null;
          }
        }
        if (onFileOpen) {
          onFileOpen(file, url);
          return;
        }

        const kind = viewerKindForFile(file);

        if (kind && url) {
          // Pool the file so the dialog reuses an already-mounted preview
          // (and the gallery inherits the live viewer after it closes).
          poolStagePath(file.path);
          setOpenedFile({ file, kind, url });
        } else if (url && typeof window !== "undefined") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      })();
    },
    [getFileUrl, onFileOpen, poolStagePath, resolvedUrlCache]
  );

  const openEntry = React.useCallback(
    (entry: FileSystemEntry) => {
      if (entry.kind === "folder") {
        navigateTo(entry.path);
      } else {
        openFile(entry);
      }
    },
    [navigateTo, openFile]
  );

  // Selecting a lazy folder (columns view, keyboard nav) prefetches children.
  const selectAndPrefetchEntry = React.useCallback(
    (entry: FileSystemEntry | null) => {
      selectEntry(entry);
      if (entry?.kind === "folder") ensureChildren(entry.path);
    },
    [ensureChildren, selectEntry]
  );

  const goBack = React.useCallback(() => {
    setHistory((previous) => ({
      ...previous,
      index: Math.max(0, previous.index - 1),
    }));
    setSearchInput("");
    selectEntry(null);
  }, [selectEntry]);

  const goForward = React.useCallback(() => {
    setHistory((previous) => ({
      ...previous,
      index: Math.min(previous.stack.length - 1, previous.index + 1),
    }));
    setSearchInput("");
    selectEntry(null);
  }, [selectEntry]);

  const currentEntries = sortedIndex.children.get(currentPath) ?? [];
  const currentFolderName = currentPath === "" ? title : pathName(currentPath) || title;
  const isLoadingCurrentFolder = loadingFolders.has(currentPath);

  // The list view tree saves its expanded folders here when it unmounts
  // (view switches, navigation) so returning to the list view — or to a
  // previously visited folder — restores the same disclosure state.
  const treeExpansionRef = React.useRef(new Map<string, readonly string[]>());

  const viewProps: FileSystemViewProps = {
    attachedStagePaths,
    currentPath,
    entries: currentEntries,
    fileFilter,
    getFileUrl,
    index: sortedIndex,
    loadPreviewImageUrl,
    loadingFolders,
    onOpen: openEntry,
    onSelect: selectAndPrefetchEntry,
    onSortColumnClick: toggleSortColumn,
    pageUrlCache,
    poolStagePath,
    registerStageHost,
    renderFilePreview,
    searchQuery,
    selectedEntry,
    selectedPath,
    sort,
    treeExpansionRef,
  };

  const openedFileName = openedFile ? (openedFile.file.name ?? openedFile.file.path) : "";
  const activeViewOption = VIEW_OPTIONS.find((option) => option.value === view);
  const viewerCloseToolbarAction = (
    <DialogClose aria-label="Close preview" render={<Button type="button" variant="ghost" size="icon-sm" />}>
      <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
    </DialogClose>
  );

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      data-slot="file-system"
      onKeyDown={(event) => {
        // ⌘F focuses the toolbar search while focus is inside the component.
        if ((event.metaKey || event.ctrlKey) && event.key === "f") {
          event.preventDefault();
          setIsSearchExpanded(true);
          searchInputRef.current?.focus();
        }
      }}
      className={cn("text-foreground flex h-[480px] min-h-0 flex-col overflow-hidden outline-none", className)}
    >
      <FileSystemIconSpriteSheet />
      <div className="border-border/70 bg-muted/40 relative grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b px-2">
        <div className="flex min-w-0 items-center gap-0.5">
          <button
            type="button"
            aria-label="Back"
            title="Back"
            disabled={!canGoBack}
            onClick={goBack}
            className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex size-7 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4.5" />
          </button>
          <button
            type="button"
            aria-label="Forward"
            title="Forward"
            disabled={!canGoForward}
            onClick={goForward}
            className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring flex size-7 shrink-0 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4.5" />
          </button>
          {headerLayout !== "minimal" ? (
            <span className="text-sm ml-1.5 truncate font-semibold">{currentFolderName}</span>
          ) : null}
        </div>
        {headerLayout !== "full" || isBelowIpadWidth ? (
          <Select value={view} onValueChange={(value) => setView(value as FileSystemView)}>
            <SelectTrigger
              size="sm"
              aria-label="View"
              // Icon-only like the sort select: sheds the base min-width to
              // hug icon + chevron at the filter button's 28px height.
              className="h-7 min-h-7 w-auto min-w-0 [&_svg]:size-4"
            >
              <SelectValue>
                {activeViewOption ? <HugeiconsIcon icon={activeViewOption.icon} className="size-4" /> : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {VIEW_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <HugeiconsIcon icon={option.icon} className="size-4" />
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Tabs value={view} onValueChange={(value) => setView(value as FileSystemView)} className="gap-0">
            <TabsList className="h-8 p-0.5">
              {VIEW_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  aria-label={`${option.label} view`}
                  title={option.label}
                  className="h-7 grow-0 px-2.5 sm:h-7"
                >
                  <HugeiconsIcon icon={option.icon} className="size-4" />
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        <div className="flex min-w-0 items-center justify-end gap-1">
          {!hideToolbarControls && (
            <>
              <FileSystemSortSelect
                layout={headerLayout}
                onKeyChange={applySortKey}
                showLabel={!isBelowIpadWidth}
                sort={sort}
              />
              <FileSystemFilterMenu
                fileTypeOptions={fileTypeOptions}
                filters={filters}
                onOpenCustomRange={openDateRangeDialog}
                onSelectDatePreset={setDatePresetFilter}
                onToggleFileType={toggleFileTypeFilterValue}
              />
              <FileSystemSearchField
                inputRef={searchInputRef}
                isExpanded={isSearchExpanded}
                layout={headerLayout}
                onExpandedChange={setIsSearchExpanded}
                onValueChange={setSearchInput}
                value={searchInput}
              />
            </>
          )}
        </div>
      </div>
      {hasActiveFilters ? (
        <div className="border-border/70 bg-muted/20 text-xs text-muted-foreground flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
          {filters.map((filter) => {
            const dateFilterType = filter.type === "fileType" ? null : filter.type;

            return (
              <FileSystemFilterPill
                key={filter.id}
                fileTypeOptions={fileTypeOptions}
                filter={filter}
                onOpenCustomRange={dateFilterType ? () => openDateRangeDialog(dateFilterType) : undefined}
                onOperatorChange={(operator) =>
                  setFilters((previous) =>
                    previous.map((entry) => (entry.id === filter.id ? { ...entry, operator } : entry))
                  )
                }
                onRemove={() => setFilters((previous) => previous.filter((entry) => entry.id !== filter.id))}
                onSelectDatePreset={(preset) =>
                  setFilters((previous) =>
                    previous.map((entry) =>
                      entry.id === filter.id
                        ? {
                            ...entry,
                            operator:
                              entry.operator === "before" || entry.operator === "after" ? entry.operator : "after",
                            value: [preset],
                          }
                        : entry
                    )
                  )
                }
                onToggleFileType={toggleFileTypeFilterValue}
              />
            );
          })}
          <button
            type="button"
            onClick={() => setFilters([])}
            className="hover:text-foreground focus-visible:ring-ring rounded-md px-1.5 py-0.5 transition-colors outline-none focus-visible:ring-2"
          >
            Clear
          </button>
        </div>
      ) : null}
      <div className="relative min-h-0 flex-1">
        {isLoadingCurrentFolder && currentEntries.length === 0 ? (
          <FileSystemEmptyState label="Loading…" isLoading />
        ) : currentEntries.length === 0 && (view !== "columns" || isSearching || hasActiveFilters) ? (
          <FileSystemEmptyState
            label={
              isSearching
                ? `No results for “${searchInput.trim()}”`
                : hasActiveFilters
                  ? "No items match the active filters"
                  : "This folder is empty"
            }
          />
        ) : view === "icons" ? (
          <FileSystemIconsView {...viewProps} />
        ) : view === "list" ? (
          <FileSystemListView {...viewProps} />
        ) : view === "columns" ? (
          <FileSystemColumnsView {...viewProps} />
        ) : (
          <FileSystemGalleryView {...viewProps} />
        )}
      </div>
      <div
        aria-live="polite"
        className="border-border/70 bg-muted/40 text-xs text-muted-foreground flex h-11 shrink-0 items-center justify-center gap-1 border-t px-3 py-1"
      >
        <span>
          {currentEntries.length}{" "}
          {isSearching
            ? currentEntries.length === 1
              ? "result"
              : "results"
            : currentEntries.length === 1
              ? "item"
              : "items"}
        </span>
        {selectedEntry ? <span>· “{selectedEntry.name}” selected</span> : null}
      </div>
      <Dialog
        open={openedFile !== null}
        onOpenChange={(open) => {
          if (!open) setOpenedFile(null);
        }}
      >
        {openedFile ? (
          <DialogContent
            className={cn("overflow-hidden p-0", VIEWER_DIALOG_CLASSNAMES[openedFile.kind])}
            showCloseButton={openedFile.kind === "image"}
          >
            <DialogTitle className="sr-only">{openedFileName}</DialogTitle>
            {openedFile.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element -- File previews render caller-provided URLs that may be object or presigned URLs.
              <img
                src={openedFile.url}
                alt={openedFileName}
                className="max-h-[88vh] w-auto max-w-full rounded-2xl object-contain"
              />
            ) : (
              // The pooled preview reparents into this host (see the layout
              // effect above), so a viewer the gallery already loaded
              // carries over live instead of remounting behind a loading
              // state.
              <div ref={dialogStageHostRef} className="flex h-full min-h-0 flex-1 flex-col" />
            )}
          </DialogContent>
        ) : null}
        {/* The pooled previews. Rendered inside <Dialog> so the dialog
            variant's close toolbar button keeps its context; each portal's
            container never changes, the container's parent does. */}
        {stagePool.map((path) => {
          const file = index.files.get(path);
          const container = stageContainers.get(path);

          if (!file || !container) return null;

          const isOpenedInDialog = openedFile !== null && openedFile.kind !== "image" && openedFile.file.path === path;

          return createPortal(
            <FileSystemGalleryStage
              file={file}
              getFileUrl={getFileUrl}
              loadPreviewImageUrl={loadPreviewImageUrl}
              pageUrlCache={pageUrlCache}
              renderFilePreview={renderFilePreview}
              toolbarActions={isOpenedInDialog ? viewerCloseToolbarAction : undefined}
              urlCache={resolvedUrlCache}
              variant={isOpenedInDialog ? "dialog" : "stage"}
            />,
            container,
            path
          );
        })}
      </Dialog>
      {dateRangeDialog ? (
        <FileSystemDateRangeDialog
          initialRange={dateRangeDialog.initialRange}
          onApply={(from, to) => {
            applyCustomDateRange(dateRangeDialog.type, from, to);
            setDateRangeDialog(null);
          }}
          onClose={() => setDateRangeDialog(null)}
        />
      ) : null}
    </div>
  );
}

// Shared style for the ghost icon buttons in the toolbar.
const TOOLBAR_ICON_BUTTON_CLASSNAME =
  "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

// macOS Finder-style toolbar search. At the full layout it sits inline in
// the header's right column; at compact widths it collapses into a ghost
// icon button that opens the input in a popover (a dot marks the button
// while a query keeps filtering the views).
function FileSystemSearchField({
  inputRef,
  isExpanded,
  layout,
  onExpandedChange,
  onValueChange,
  value,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  isExpanded: boolean;
  layout: "full" | "compact" | "minimal";
  onExpandedChange: (isExpanded: boolean) => void;
  onValueChange: (value: string) => void;
  value: string;
}) {
  const isInline = layout === "full";

  React.useEffect(() => {
    if (!isInline && isExpanded) inputRef.current?.focus();
  }, [inputRef, isExpanded, isInline]);

  const input = (
    <div
      className={cn(
        "border-input bg-popover text-sm text-foreground shadow-xs/5 focus-within:ring-ring focus-within:ring-offset-background dark:bg-input/32 relative flex h-7 min-w-0 flex-1 items-center rounded-lg border transition-shadow outline-none not-dark:bg-clip-padding before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--radius-lg)-1px)] not-focus-within:before:shadow-[0_1px_--theme(--color-black/4%)] focus-within:ring-2 focus-within:ring-offset-1 dark:not-focus-within:before:shadow-[0_-1px_--theme(--color-white/6%)]",
        isInline && "max-w-56"
      )}
    >
      <HugeiconsIcon
        icon={Search01Icon}
        className="text-muted-foreground pointer-events-none absolute left-2 size-3.5"
      />
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        role="searchbox"
        aria-label="Search files"
        placeholder="Search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          event.stopPropagation();
          if (value) {
            onValueChange("");
          } else {
            onExpandedChange(false);
            event.currentTarget.blur();
          }
        }}
        className="placeholder:text-muted-foreground h-full w-full min-w-0 rounded-[inherit] bg-transparent pr-6 pl-7 outline-none"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-1 flex size-5 items-center justify-center rounded-sm transition-colors outline-none focus-visible:ring-2"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
        </button>
      ) : null}
    </div>
  );

  if (isInline) {
    // A fixed basis (not flex-1) keeps the whole toolbar cluster packed
    // against the header's right edge; the input shrinks first when the
    // header tightens.
    return <div className="flex w-56 min-w-32 items-center">{input}</div>;
  }

  return (
    <Popover open={isExpanded} onOpenChange={onExpandedChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="Search"
            title="Search"
            className={cn(TOOLBAR_ICON_BUTTON_CLASSNAME, "relative")}
          />
        }
      >
        <HugeiconsIcon icon={Search01Icon} className="size-4" />
        {value ? <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" /> : null}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={6} className="w-64 p-1">
        {input}
      </PopoverContent>
    </Popover>
  );
}

// Toolbar "sort by" select. The full layout shows the active key's label; at
// compact widths the trigger collapses to the sort glyph + chevron.
function FileSystemSortSelect({
  layout,
  onKeyChange,
  showLabel,
  sort,
}: {
  layout: "full" | "compact" | "minimal";
  onKeyChange: (key: FileSystemSortKey) => void;
  showLabel: boolean;
  sort: FileSystemSortState;
}) {
  const activeOption = SORT_OPTIONS.find((option) => option.key === sort.key);

  return (
    <Select value={sort.key} onValueChange={(value) => onKeyChange(value as FileSystemSortKey)}>
      <SelectTrigger
        size="sm"
        aria-label="Sort by"
        title="Sort by"
        className="h-7 min-h-7 w-auto min-w-0 shrink-0 [&_svg]:size-4"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <HugeiconsIcon icon={ArrowUpDownIcon} className="size-4" />
            {layout === "full" && showLabel ? activeOption?.triggerLabel : null}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end" alignItemWithTrigger={false}>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.key} value={option.key}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Searchable file-type list (cmdk) rendered inside a menu popup, so the
// long MIME list can be filtered by typing. Selection toggles stay open for
// multi-select; ArrowUp/Down and Enter come from cmdk's combobox semantics.
function FileSystemFileTypeCommand({
  checkedMimes,
  onToggle,
  options,
}: {
  checkedMimes: string[];
  onToggle: (mime: string, checked: boolean) => void;
  options: FileTypeFilterOption[];
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // The menu focuses its popup when it opens; pull focus into the search
  // field so typing filters immediately.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Command
      // -m-1 spans the menu viewport's built-in padding so the search
      // field's bottom border runs edge to edge.
      className="-m-1 w-[calc(100%+--spacing(2))] bg-transparent"
      // cmdk owns the keyboard while focus is in the list; only Escape
      // (close the menu) and Tab continue outward.
      onKeyDown={(event) => {
        if (event.key !== "Escape" && event.key !== "Tab") {
          event.stopPropagation();
        }
      }}
    >
      <CommandInput ref={inputRef} placeholder="Search file types…" className="h-9" />
      <CommandList className="max-h-none">
        <CommandEmpty>No file types found.</CommandEmpty>
        <ScrollArea orientation="vertical" className="h-auto max-h-64">
          {FILE_TYPE_FILTER_GROUPS.map((group) => {
            const groupOptions = options.filter((option) => option.group === group);

            if (groupOptions.length === 0) return null;

            return (
              <CommandGroup key={group} heading={group}>
                {groupOptions.map((option) => {
                  const isChecked = checkedMimes.includes(option.mime);

                  return (
                    <CommandItem
                      key={option.mime}
                      value={option.label}
                      keywords={[option.mime]}
                      onSelect={() => onToggle(option.mime, !isChecked)}
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        className={cn("text-foreground size-4", !isChecked && "opacity-0")}
                      />
                      <FileTypeIcon fileName={option.iconFileName} className="size-4" />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            );
          })}
        </ScrollArea>
      </CommandList>
    </Command>
  );
}

// Toolbar filter menu: file types as a searchable checklist, dates as
// single-select presets plus a custom range, mirroring Extend's table
// filters.
function FileSystemFilterMenu({
  fileTypeOptions,
  filters,
  onOpenCustomRange,
  onSelectDatePreset,
  onToggleFileType,
}: {
  fileTypeOptions: FileTypeFilterOption[];
  filters: FileSystemFilter[];
  onOpenCustomRange: (type: FileSystemDateFilterType) => void;
  onSelectDatePreset: (type: FileSystemDateFilterType, preset: string) => void;
  onToggleFileType: (mime: string, checked: boolean) => void;
}) {
  const fileTypeFilter = filters.find((filter) => filter.type === "fileType");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Filter"
            title="Filter"
            className="relative size-7 sm:size-7"
          />
        }
      >
        <HugeiconsIcon icon={FilterIcon} className="size-4" />
        {filters.length > 0 ? <span className="bg-primary absolute top-1 right-1 size-1.5 rounded-full" /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={File01Icon} className="text-muted-foreground size-4" />
            File type
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-60">
            <FileSystemFileTypeCommand
              checkedMimes={fileTypeFilter?.value ?? []}
              onToggle={onToggleFileType}
              options={fileTypeOptions}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {(["dateModified", "dateCreated"] as const).map((type) => (
          <DropdownMenuSub key={type}>
            <DropdownMenuSubTrigger>
              <HugeiconsIcon icon={Calendar03Icon} className="text-muted-foreground size-4" />
              {FILTER_TYPE_LABELS[type]}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <ScrollArea orientation="vertical" className="h-auto max-h-72">
                {DATE_FILTER_PRESETS.map((preset) => (
                  <DropdownMenuItem key={preset} onClick={() => onSelectDatePreset(type, preset)}>
                    {preset}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => onOpenCustomRange(type)}>Custom date range…</DropdownMenuItem>
              </ScrollArea>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const FILTER_PILL_SEGMENT_CLASSNAME =
  "flex h-5 items-center gap-1 border border-l-0 bg-background px-1.5 whitespace-nowrap text-foreground";

const FILTER_PILL_BUTTON_CLASSNAME = cn(
  FILTER_PILL_SEGMENT_CLASSNAME,
  "hover:bg-accent focus-visible:ring-ring transition-colors outline-none focus-visible:ring-2"
);

// One applied filter, rendered as a segmented pill in the status bar:
// type · operator · value · remove, each segment interactive like Extend's
// table filter pills.
function FileSystemFilterPill({
  fileTypeOptions,
  filter,
  onOpenCustomRange,
  onOperatorChange,
  onRemove,
  onSelectDatePreset,
  onToggleFileType,
}: {
  fileTypeOptions: FileTypeFilterOption[];
  filter: FileSystemFilter;
  onOpenCustomRange?: () => void;
  onOperatorChange: (operator: FileSystemFilterOperator) => void;
  onRemove: () => void;
  onSelectDatePreset: (preset: string) => void;
  onToggleFileType: (mime: string, checked: boolean) => void;
}) {
  const isCustomRange = filter.type !== "fileType" && isCustomDateRangeValue(filter.value);
  const selectedTypeLabels =
    filter.type === "fileType"
      ? filter.value.map((mime) => fileTypeOptions.find((option) => option.mime === mime)?.label ?? mime)
      : [];

  return (
    <div className="text-xs flex items-center">
      <span className={cn(FILTER_PILL_SEGMENT_CLASSNAME, "rounded-l-md border-l text-primary")}>
        <HugeiconsIcon icon={filter.type === "fileType" ? File01Icon : Calendar03Icon} className="size-3" />
        {FILTER_TYPE_LABELS[filter.type]}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<button type="button" className={cn(FILTER_PILL_BUTTON_CLASSNAME, "text-primary")} />}
        >
          {FILTER_OPERATOR_LABELS[filter.operator]}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-28">
          {filterOperatorChoices(filter).map((operator) => (
            <DropdownMenuItem key={operator} onClick={() => onOperatorChange(operator)}>
              {FILTER_OPERATOR_LABELS[operator]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {filter.type === "fileType" ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button type="button" title={selectedTypeLabels.join(", ")} className={FILTER_PILL_BUTTON_CLASSNAME} />
            }
          >
            {filter.value.length === 1 ? selectedTypeLabels[0] : `${filter.value.length} selected`}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <FileSystemFileTypeCommand
              checkedMimes={filter.value}
              onToggle={onToggleFileType}
              options={fileTypeOptions}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : isCustomRange ? (
        <button type="button" onClick={onOpenCustomRange} className={FILTER_PILL_BUTTON_CLASSNAME}>
          {filter.value.map((value) => new Date(value).toLocaleDateString("en-US")).join(" – ")}
        </button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger render={<button type="button" className={FILTER_PILL_BUTTON_CLASSNAME} />}>
            {filter.value[0]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <ScrollArea orientation="vertical" className="h-auto max-h-72">
              {DATE_FILTER_PRESETS.map((preset) => (
                <DropdownMenuItem key={preset} onClick={() => onSelectDatePreset(preset)}>
                  {preset}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={onOpenCustomRange}>Custom date range…</DropdownMenuItem>
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <button
        type="button"
        aria-label={`Remove ${FILTER_TYPE_LABELS[filter.type]} filter`}
        onClick={onRemove}
        className={cn(FILTER_PILL_BUTTON_CLASSNAME, "text-muted-foreground hover:text-foreground rounded-r-md px-1")}
      >
        <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
      </button>
    </div>
  );
}

function formatDateInputValue(date: Date | undefined) {
  if (!date) return "";

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateInputValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return undefined;

  const isoMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);

  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));

    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const parsed = Date.parse(trimmed);

  return Number.isNaN(parsed) ? undefined : new Date(parsed);
}

const DATE_RANGE_DIALOG_PRESETS = [
  "Last 7 days",
  "This month",
  "Last 1 month",
  "Last 3 months",
  "This year",
  "Last 12 months",
];

function dateRangePresetRange(preset: string) {
  const from = new Date();
  const to = new Date();

  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  switch (preset) {
    case "Last 7 days":
      from.setDate(from.getDate() - 6);
      break;
    case "This month":
      from.setDate(1);
      break;
    case "Last 1 month":
      from.setMonth(from.getMonth() - 1);
      break;
    case "Last 3 months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "This year":
      from.setMonth(0, 1);
      break;
    case "Last 12 months":
      from.setFullYear(from.getFullYear() - 1);
      break;
  }
  return { from, to };
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function calendarDayKey(date: Date) {
  return date.getFullYear() * 10_000 + date.getMonth() * 100 + date.getDate();
}

// Two-month range calendar for the custom date range dialog (one month at
// phone widths). Clicking sets the start, then the end; clicking before the
// start swaps the ends, and a third click restarts the range.
function FileSystemRangeCalendar({
  onSelect,
  range,
}: {
  onSelect: (range: { from?: Date; to?: Date }) => void;
  range: { from?: Date; to?: Date };
}) {
  const [viewMonth, setViewMonth] = React.useState(() => {
    const base = range.from ?? new Date();

    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const months = [viewMonth, new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)];
  const fromKey = range.from ? calendarDayKey(range.from) : null;
  const toKey = range.to ? calendarDayKey(range.to) : null;
  const todayKey = calendarDayKey(new Date());

  const handleDayClick = (day: Date) => {
    if (!range.from || range.to) {
      onSelect({ from: day });
    } else if (calendarDayKey(day) < calendarDayKey(range.from)) {
      onSelect({ from: day, to: range.from });
    } else {
      onSelect({ from: range.from, to: day });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))}
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute top-0 left-0 flex size-6 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => setViewMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))}
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring absolute top-0 right-0 flex size-6 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-2"
      >
        <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
      </button>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {months.map((month, monthIndex) => {
          const firstWeekday = month.getDay();
          const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
          const cells = [
            ...Array.from({ length: firstWeekday }, () => null),
            ...Array.from(
              { length: dayCount },
              (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)
            ),
          ];

          return (
            <div key={`${month.getFullYear()}-${month.getMonth()}`} className={cn(monthIndex === 1 && "max-sm:hidden")}>
              <div className="text-sm text-center leading-6 font-medium">
                {month.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="text-xs text-muted-foreground mt-1 grid grid-cols-7 text-center">
                {WEEKDAY_LABELS.map((weekday) => (
                  <span key={weekday} className="h-6 leading-6">
                    {weekday}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-px">
                {cells.map((day, cellIndex) => {
                  if (!day) return <span key={cellIndex} />;

                  const dayKey = calendarDayKey(day);
                  const isFrom = dayKey === fromKey;
                  const isTo = dayKey === toKey;
                  const isWithinRange = fromKey !== null && toKey !== null && dayKey > fromKey && dayKey < toKey;

                  return (
                    <button
                      key={cellIndex}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={cn(
                        "text-xs hover:bg-accent focus-visible:ring-ring flex h-7 items-center justify-center rounded-md tabular-nums transition-colors outline-none focus-visible:ring-2",
                        isWithinRange && "bg-accent rounded-none",
                        (isFrom || isTo) && "bg-primary text-primary-foreground hover:bg-primary",
                        isFrom && toKey !== null && fromKey !== toKey && "rounded-r-none",
                        isTo && fromKey !== toKey && "rounded-l-none",
                        dayKey === todayKey && !isFrom && !isTo && "font-semibold text-primary"
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom date range dialog mirroring Extend's table filters: From/To inputs,
// a two-month range calendar, and quick presets. Applied ranges span from
// the start of the first day to the end of the last.
function FileSystemDateRangeDialog({
  initialRange,
  onApply,
  onClose,
}: {
  initialRange?: { from: Date; to: Date };
  onApply: (from: Date, to: Date) => void;
  onClose: () => void;
}) {
  const [range, setRange] = React.useState<{ from?: Date; to?: Date }>(() => initialRange ?? {});
  const [fromInput, setFromInput] = React.useState(() => formatDateInputValue(initialRange?.from));
  const [toInput, setToInput] = React.useState(() => formatDateInputValue(initialRange?.to));

  const selectRange = (next: { from?: Date; to?: Date }) => {
    setRange(next);
    if (next.from) setFromInput(formatDateInputValue(next.from));
    if (next.to) setToInput(formatDateInputValue(next.to));
  };

  const dateField = (label: string, value: string, onChange: (value: string) => void) => (
    <div className="flex flex-1 flex-col gap-1.5">
      <span className="text-xs font-medium">{label}</span>
      <div className="relative flex items-center">
        <HugeiconsIcon
          icon={Calendar03Icon}
          className="text-muted-foreground pointer-events-none absolute left-2.5 size-3.5"
        />
        <Input
          type="text"
          value={value}
          placeholder="YYYY-MM-DD"
          aria-label={`${label} date`}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 pl-8 sm:h-8"
        />
      </div>
    </div>
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-[30rem] max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle>Custom date range</DialogTitle>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4">
          <div className="flex gap-3">
            {dateField("From", fromInput, (value) => {
              setFromInput(value);

              const parsed = parseDateInputValue(value);

              if (parsed) setRange((previous) => ({ ...previous, from: parsed }));
            })}
            {dateField("To", toInput, (value) => {
              setToInput(value);

              const parsed = parseDateInputValue(value);

              if (parsed) setRange((previous) => ({ ...previous, to: parsed }));
            })}
          </div>
          <FileSystemRangeCalendar range={range} onSelect={selectRange} />
          <div className="grid grid-cols-3 gap-2">
            {DATE_RANGE_DIALOG_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => selectRange(dateRangePresetRange(preset))}
              >
                {preset}
              </Button>
            ))}
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!range.from || !range.to}
            onClick={() => {
              if (!range.from || !range.to) return;

              const from = new Date(range.from);
              const to = new Date(range.to);

              from.setHours(0, 0, 0, 0);
              to.setHours(23, 59, 59, 999);
              onApply(from, to);
            }}
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type FileSystemViewProps = {
  currentPath: string;
  entries: FileSystemEntry[];
  fileFilter: ((file: FileEntry) => boolean) | null;
  getFileUrl?: (file: FileSystemFileItem) => string | Promise<string>;
  index: FileSystemIndex;
  loadPreviewImageUrl?: (file: FileSystemFileItem, pageIndex: number) => Promise<string | null>;
  loadingFolders: Set<string>;
  onOpen: (entry: FileSystemEntry) => void;
  onSelect: (entry: FileSystemEntry | null) => void;
  onSortColumnClick: (key: FileSystemSortKey) => void;
  /** Pooled paths currently attached to the DOM (reveal instantly). */
  attachedStagePaths: string[];
  /** `"path#pageIndex"` → thumbnail URL, shared by every pager. */
  pageUrlCache: Map<string, string>;
  /** Admits a file into the root-owned keep-alive preview pool. */
  poolStagePath: (path: string) => void;
  /** Mounts/unmounts the gallery host element for a pooled path. */
  registerStageHost: (path: string, element: HTMLElement | null) => void;
  renderFilePreview?: (file: FileSystemFileItem) => React.ReactNode;
  searchQuery: string;
  selectedEntry: FileSystemEntry | null;
  selectedPath: string | null;
  sort: FileSystemSortState;
  /** Expanded tree folders per folder path, surviving view switches. */
  treeExpansionRef: React.RefObject<Map<string, readonly string[]>>;
};

// Resolves a display URL for a file: its own `url`, else via `getFileUrl`.
// Keyed by path/url (not object identity) so manifest churn — e.g. thumbnails
// streaming in — doesn't re-trigger presign calls for the same file. An
// optional `cache` shared across mounts serves revisited files synchronously:
// no repeat presign round-trip (and no loading flash), and the stable URL
// keeps the browser's HTTP cache valid for already-fetched content.
function useResolvedFileUrl(
  file: FileEntry | null,
  getFileUrl?: (file: FileSystemFileItem) => string | Promise<string>,
  cache?: Map<string, string>
) {
  const [state, setState] = React.useState<{
    isResolving: boolean;
    url: string | null;
  }>(() => ({
    isResolving: false,
    url: file ? (file.url ?? cache?.get(file.path) ?? null) : null,
  }));
  const fileRef = React.useRef(file);

  React.useEffect(() => {
    fileRef.current = file;
  });

  const filePath = file?.path ?? null;
  const fileUrl = file?.url ?? null;

  React.useEffect(() => {
    const currentFile = fileRef.current;
    const knownUrl = fileUrl ?? (filePath ? (cache?.get(filePath) ?? null) : null);

    if (!currentFile || knownUrl || !getFileUrl) {
      setState({ isResolving: false, url: knownUrl });
      return;
    }

    let isCurrent = true;

    setState({ isResolving: true, url: null });
    void Promise.resolve(getFileUrl(currentFile))
      .then((url) => {
        if (url) cache?.set(currentFile.path, url);
        if (isCurrent) setState({ isResolving: false, url });
      })
      .catch(() => {
        if (isCurrent) setState({ isResolving: false, url: null });
      });

    return () => {
      isCurrent = false;
    };
  }, [cache, filePath, fileUrl, getFileUrl]);

  return state;
}

// Returns `value` once it has stopped changing for `delay` ms. Gallery
// navigation scrubs past files quickly; heavy previews (document viewers,
// presigned URL resolution) only kick in for the file the user lands on.
function useSettledValue<T>(value: T, delay: number): T {
  const [settled, setSettled] = React.useState(value);

  React.useEffect(() => {
    if (Object.is(settled, value)) return;

    const timeout = window.setTimeout(() => setSettled(value), delay);

    return () => window.clearTimeout(timeout);
  }, [delay, settled, value]);

  return settled;
}

function FileSystemEmptyState({ label, isLoading = false }: { label: string; isLoading?: boolean }) {
  return (
    <div
      className={cn(
        "text-sm text-muted-foreground flex size-full items-center justify-center",
        isLoading && "animate-pulse motion-reduce:animate-none"
      )}
    >
      {label}
    </div>
  );
}

const ARROW_KEYS = new Set(["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"]);

// Type-ahead buffers reset after this idle period, like Finder.
const TYPE_AHEAD_RESET_MS = 700;

// Letters and digits only — the same key test the tree uses — so shortcuts
// and whitespace scrolling stay untouched.
function isTypeAheadKey(event: React.KeyboardEvent) {
  return (
    event.key.length === 1 && /^[\p{L}\p{N}]$/u.test(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey
  );
}

// Shared Finder-style type-ahead used by every view: printable keys
// accumulate a buffer that jumps to the next entry whose name starts with
// it, and repeating a single letter cycles through entries with that
// prefix. Each view passes its own display-ordered candidate list, so the
// same keystrokes land on the same file everywhere.
function useEntryTypeAhead() {
  const stateRef = React.useRef({ buffer: "", timeout: 0 });

  React.useEffect(() => {
    const state = stateRef.current;

    return () => window.clearTimeout(state.timeout);
  }, []);

  return React.useCallback((event: React.KeyboardEvent, entries: readonly FileSystemEntry[], currentIndex: number) => {
    if (!isTypeAheadKey(event) || entries.length === 0) return null;

    // Embedded viewers (and any future inputs) keep their keystrokes.
    const target = event.target;

    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT")
    ) {
      return null;
    }

    const state = stateRef.current;

    window.clearTimeout(state.timeout);
    state.timeout = window.setTimeout(() => {
      state.buffer = "";
    }, TYPE_AHEAD_RESET_MS);
    state.buffer += event.key.toLowerCase();

    // A repeated single letter advances past the current entry; a longer
    // buffer refines the match in place.
    const startIndex = currentIndex < 0 ? 0 : currentIndex + (state.buffer.length === 1 ? 1 : 0);

    for (let step = 0; step < entries.length; step += 1) {
      const entry = entries[(startIndex + step) % entries.length];

      if (entry.name.toLowerCase().startsWith(state.buffer)) {
        event.preventDefault();
        return entry;
      }
    }
    event.preventDefault();
    return null;
  }, []);
}

// Selects (and focuses) the entry reached by an arrow key. Up/down use row
// geometry so navigation follows the rendered auto-fill grid.
function moveGridSelection({
  entries,
  itemRefs,
  key,
  onSelect,
  selectedPath,
}: {
  entries: FileSystemEntry[];
  itemRefs: Map<string, HTMLButtonElement>;
  key: string;
  onSelect: (entry: FileSystemEntry | null) => void;
  selectedPath: string | null;
}) {
  if (entries.length === 0) return false;

  const currentIndex = entries.findIndex((entry) => entry.path === selectedPath);
  let nextEntry: FileSystemEntry | undefined;

  if (currentIndex === -1) {
    nextEntry = entries[0];
  } else if (key === "ArrowLeft" || key === "ArrowRight") {
    nextEntry = entries[currentIndex + (key === "ArrowLeft" ? -1 : 1)];
  } else {
    const currentElement = itemRefs.get(entries[currentIndex].path);

    if (!currentElement) return false;

    const currentRect = currentElement.getBoundingClientRect();
    let bestScore = Infinity;

    for (const entry of entries) {
      if (entry.path === selectedPath) continue;

      const rect = itemRefs.get(entry.path)?.getBoundingClientRect();

      if (!rect) continue;

      const rowDelta = key === "ArrowDown" ? rect.top - currentRect.top : currentRect.top - rect.top;

      if (rowDelta <= 1) continue;

      const score = rowDelta * 1000 + Math.abs(rect.left - currentRect.left);

      if (score < bestScore) {
        bestScore = score;
        nextEntry = entry;
      }
    }
  }

  if (!nextEntry) return false;

  onSelect(nextEntry);
  itemRefs.get(nextEntry.path)?.focus();
  return true;
}

// Icon grid geometry (px at the default 16px root font size). Tiles have a
// fixed height — a 4rem glyph box plus a reserved two-line label — so rows
// share one stride and the grid can window cleanly.
const ICON_GRID_PADDING = 12; // p-3
const ICON_MIN_TILE_WIDTH = 104; // 6.5rem
const ICON_TILE_GAP_X = 4; // gap-x-1
const ICON_TILE_HEIGHT = 102; // h-16 glyph box + gap-1.5 + two text-xs lines
const ICON_ROW_GAP = 12; // gap-y-3
const ICON_ROW_STRIDE = ICON_TILE_HEIGHT + ICON_ROW_GAP;

function FileSystemIconsView({ entries, onOpen, onSelect, renderFilePreview, selectedPath }: FileSystemViewProps) {
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const typeAhead = useEntryTypeAhead();
  // The column count mirrors what `repeat(auto-fill, minmax(6.5rem, 1fr))`
  // produces (the CSS owns the actual layout) so item indices map to grid
  // rows — the windowing below depends on that mapping. It stays null until
  // the first client measure; server markup must not guess.
  const [columnCount, setColumnCount] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const available = viewport.clientWidth - ICON_GRID_PADDING * 2;

      setColumnCount(Math.max(1, Math.floor((available + ICON_TILE_GAP_X) / (ICON_MIN_TILE_WIDTH + ICON_TILE_GAP_X))));
    };
    const observer = new ResizeObserver(update);

    update();
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const resolvedColumnCount = columnCount ?? 1;
  const rowCount = Math.ceil(entries.length / resolvedColumnCount);
  const { end, start } = useVirtualWindow({
    count: rowCount,
    itemStride: ICON_ROW_STRIDE,
    leadingPx: ICON_GRID_PADDING,
    overscan: 4,
    viewportRef,
  });
  const visibleEntries = entries.slice(start * resolvedColumnCount, end * resolvedColumnCount);

  // Selection can land outside the window (view switches, shrinking results);
  // bring its row back into the viewport so the tile mounts and is focusable.
  React.useLayoutEffect(() => {
    if (!selectedPath) return;

    const entryIndex = entries.findIndex((entry) => entry.path === selectedPath);

    if (entryIndex === -1) return;

    scrollIndexIntoView({
      index: Math.floor(entryIndex / resolvedColumnCount),
      itemSize: ICON_TILE_HEIGHT,
      itemStride: ICON_ROW_STRIDE,
      leadingPx: ICON_GRID_PADDING,
      viewport: viewportRef.current,
    });
  }, [entries, resolvedColumnCount, selectedPath]);

  // Roving tabindex: the grid is a single tab stop (the selected tile when
  // rendered, else the first rendered one), so Shift+Tab returns to the
  // toolbar like in the list view.
  const tabStopPath = visibleEntries.some((entry) => entry.path === selectedPath)
    ? selectedPath
    : (visibleEntries[0]?.path ?? null);

  return (
    <ScrollArea
      orientation="vertical"
      viewportRef={viewportRef}
      viewportClassName="p-3"
      viewportProps={{
        onClick: (event) => {
          if (event.target === event.currentTarget) onSelect(null);
        },
      }}
    >
      <div
        className="relative"
        // The scroll-height spacer needs the measured column count; until
        // then the absolutely positioned grid alone defines the scrollable
        // overflow, so the server-rendered frame doesn't flash an
        // oversized scroll range.
        style={{
          height: columnCount !== null && rowCount ? rowCount * ICON_ROW_STRIDE - ICON_ROW_GAP : undefined,
        }}
      >
        <div
          role="listbox"
          aria-label="Files"
          className="absolute inset-x-0 grid gap-x-1 gap-y-3"
          // The auto-fill expression produces the same column count the
          // ResizeObserver measures (the measurement exists only for the
          // windowing math), so the server-rendered first paint is already
          // a grid instead of flashing a single stacked column until the
          // first client measure.
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(6.5rem, 1fr))",
            top: start * ICON_ROW_STRIDE,
          }}
          onKeyDown={(event) => {
            if (!ARROW_KEYS.has(event.key)) {
              const match = typeAhead(
                event,
                entries,
                entries.findIndex((entry) => entry.path === selectedPath)
              );

              if (match) {
                onSelect(match);
                // The matched tile may be outside the virtual window; the
                // selection effect scrolls it in, and focus follows once it
                // has mounted.
                requestAnimationFrame(() => itemRefs.current.get(match.path)?.focus());
              }
              return;
            }
            if (
              moveGridSelection({
                entries,
                itemRefs: itemRefs.current,
                key: event.key,
                onSelect,
                selectedPath,
              })
            ) {
              event.preventDefault();
            }
          }}
        >
          {visibleEntries.map((entry) => {
            const isSelected = entry.path === selectedPath;

            return (
              <button
                key={entry.path}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={entry.path === tabStopPath ? 0 : -1}
                ref={(element) => {
                  if (element) {
                    itemRefs.current.set(entry.path, element);
                  } else {
                    itemRefs.current.delete(entry.path);
                  }
                }}
                onClick={() => onSelect(entry)}
                onDoubleClick={() => onOpen(entry)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onOpen(entry);
                }}
                className="group flex h-[6.375rem] flex-col items-center gap-1.5 outline-none"
              >
                <span
                  className={cn(
                    "group-focus-visible:ring-ring flex h-16 w-20 shrink-0 items-center justify-center rounded-lg p-1 transition-colors group-focus-visible:ring-2",
                    isSelected && "bg-accent"
                  )}
                >
                  {entry.kind === "folder" ? (
                    <FileSystemFolderGlyph className="h-13 w-auto drop-shadow-sm" />
                  ) : (
                    <FileVisual
                      file={entry}
                      className={cn(
                        "shadow-xs rounded-sm",
                        // Landscape thumbnails get extra width so they fill
                        // the tile instead of rendering as a short sliver.
                        (entry.previewAspectRatio ?? 0.78) > 1.2 ? "w-[4.75rem]" : "w-12"
                      )}
                      previewAspectRatio={0.78}
                      renderFilePreview={renderFilePreview}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs max-w-full rounded-sm px-1.5 py-px text-center leading-tight break-words",
                    isSelected ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}
                >
                  <span className="line-clamp-2">{entry.name}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

// One sortable column header for the list view; the active column shows the
// direction chevron on its right.
function FileSystemListColumnHeader({
  className,
  label,
  onClick,
  sort,
  sortKey,
}: {
  className?: string;
  label: string;
  onClick: (key: FileSystemSortKey) => void;
  sort: FileSystemSortState;
  sortKey: FileSystemSortKey;
}) {
  const isActive = sort.key === sortKey;

  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={cn(
        "hover:text-foreground focus-visible:ring-ring flex items-center gap-0.5 rounded-sm py-0.5 transition-colors outline-none focus-visible:ring-2",
        isActive && "text-foreground",
        className
      )}
    >
      {label}
      {isActive ? (
        <HugeiconsIcon icon={sort.direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon} className="size-3 shrink-0" />
      ) : null}
    </button>
  );
}

function FileSystemListView({
  currentPath,
  fileFilter,
  index,
  onOpen,
  onSelect,
  onSortColumnClick,
  searchQuery,
  selectedPath,
  sort,
  treeExpansionRef,
}: FileSystemViewProps) {
  // Filters narrow the path list handed to the tree; the search query stays
  // out of it so the tree's own search session (with match highlighting)
  // keeps handling it without remounts per keystroke.
  const relativePaths = React.useMemo(() => {
    const paths: string[] = [];

    for (const [path, file] of index.files) {
      if (currentPath === "" || path.startsWith(currentPath)) {
        const relativePath = path.slice(currentPath.length);

        if (!relativePath) continue;
        if (fileFilter && !fileFilter(file)) continue;
        paths.push(relativePath);
      }
    }
    return paths.sort();
  }, [currentPath, fileFilter, index]);

  if (relativePaths.length === 0) {
    return <FileSystemEmptyState label={fileFilter ? "No items match the active filters" : "This folder is empty"} />;
  }

  return (
    <div className="flex size-full flex-col">
      {/* Paddings match the tree's row geometry: name text starts 46px in
          (16px tree padding + 30px icon lane), metadata ends 24px from the
          right (16px tree padding + 8px decoration inset). */}
      <div className="text-xs text-muted-foreground flex shrink-0 items-center border-b py-1 pr-6 pl-[46px] font-medium">
        <FileSystemListColumnHeader
          className="flex-1 justify-start"
          label="Name"
          onClick={onSortColumnClick}
          sort={sort}
          sortKey="name"
        />
        <FileSystemListColumnHeader
          className="w-44 justify-start"
          label="Date Modified"
          onClick={onSortColumnClick}
          sort={sort}
          sortKey="updatedAt"
        />
        <FileSystemListColumnHeader
          className="w-20 justify-start"
          label="Size"
          onClick={onSortColumnClick}
          sort={sort}
          sortKey="size"
        />
      </div>
      {/* Keyed by folder only: navigation remounts the tree, while filter,
          sort, and manifest changes update the mounted model in place so
          folder disclosure state survives them. */}
      <FileSystemPierreTree
        key={currentPath}
        currentPath={currentPath}
        hasActiveFilters={fileFilter !== null}
        index={index}
        initialSelectedPath={
          selectedPath?.startsWith(currentPath) ? selectedPath.slice(currentPath.length).replace(/\/$/, "") : null
        }
        onOpen={onOpen}
        onSelect={onSelect}
        relativePaths={relativePaths}
        searchQuery={searchQuery}
        sort={sort}
        treeExpansionRef={treeExpansionRef}
      />
    </div>
  );
}

// Embedded thumbnail symbols grow the sprite injected into the tree's shadow
// DOM (data-URL covers can run hundreds of KB each); past this many the
// remaining files fall back to the built-in file-type icons alone.
const TREE_THUMBNAIL_SPRITE_LIMIT = 400;

function FileSystemPierreTree({
  currentPath,
  hasActiveFilters,
  index,
  initialSelectedPath,
  onOpen,
  onSelect,
  relativePaths,
  searchQuery,
  sort,
  treeExpansionRef,
}: {
  currentPath: string;
  hasActiveFilters: boolean;
  index: FileSystemIndex;
  initialSelectedPath: string | null;
  onOpen: (entry: FileSystemEntry) => void;
  onSelect: (entry: FileSystemEntry | null) => void;
  relativePaths: string[];
  searchQuery: string;
  sort: FileSystemSortState;
  treeExpansionRef: React.RefObject<Map<string, readonly string[]>>;
}) {
  // The tree's comparator receives whole paths, not siblings, so it walks
  // the shared segments and applies the active sort at the first level the
  // two paths diverge — keeping directories first per level, the tree's
  // default convention. Lookups go through the index maps, which are stable
  // across search keystrokes.
  const indexFiles = index.files;
  const indexFolders = index.folders;
  const sortComparator = React.useMemo<"default" | FileTreeSortComparator>(() => {
    if (sort.key === DEFAULT_SORT.key && sort.direction === DEFAULT_SORT.direction) {
      return "default";
    }

    const entryAtDepth = (sortEntry: FileTreeSortEntry, depth: number) => {
      const isDirectory = depth < sortEntry.segments.length - 1 || sortEntry.isDirectory;
      const absolutePath = `${currentPath}${sortEntry.segments.slice(0, depth + 1).join("/")}${isDirectory ? "/" : ""}`;

      return isDirectory ? indexFolders.get(absolutePath) : indexFiles.get(absolutePath);
    };

    return (left, right) => {
      const sharedDepth = Math.min(left.segments.length, right.segments.length);

      for (let depth = 0; depth < sharedDepth; depth += 1) {
        if (left.segments[depth] === right.segments[depth]) continue;

        const leftIsDirectory = depth < left.segments.length - 1 || left.isDirectory;
        const rightIsDirectory = depth < right.segments.length - 1 || right.isDirectory;

        if (leftIsDirectory !== rightIsDirectory) {
          return leftIsDirectory ? -1 : 1;
        }

        const leftEntry = entryAtDepth(left, depth);
        const rightEntry = entryAtDepth(right, depth);

        if (leftEntry && rightEntry) {
          return compareEntriesBySort(leftEntry, rightEntry, sort);
        }
        return left.segments[depth] < right.segments[depth] ? -1 : 1;
      }
      return left.segments.length - right.segments.length;
    };
  }, [currentPath, indexFiles, indexFolders, sort]);
  const preparedInput = React.useMemo(
    () => prepareFileTreeInput(relativePaths, { sort: sortComparator }),
    [relativePaths, sortComparator]
  );
  // Inject per-file thumbnails into the tree's shadow DOM as sprite symbols
  // wrapping an <image>, remapped onto rows by file basename. Files without
  // a thumbnail resolve through the built-in complete icon set instead — the
  // same colored file-type icons the other views use. The chevron is
  // remapped to the Hugeicons arrow so it matches the rest of the component;
  // the tree's rotation CSS keys off data-icon-name, which remapping keeps.
  const icons = React.useMemo(() => {
    const byFileName: Record<string, { name: string; viewBox: string }> = {};
    const symbols: string[] = [
      `<symbol id="file-system-chevron" viewBox="0 0 24 24"><path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></symbol>`,
    ];

    let thumbnailCount = 0;

    for (const relativePath of relativePaths) {
      if (thumbnailCount >= TREE_THUMBNAIL_SPRITE_LIMIT) break;

      const file = index.files.get(`${currentPath}${relativePath}`);
      const coverUrl = file ? filePreviewUrls(file)[0] : undefined;

      if (!file || !coverUrl) continue;

      const baseName = file.name.toLowerCase();

      if (byFileName[baseName]) continue;

      const symbolId = `file-system-thumbnail-${symbols.length}`;

      symbols.push(
        `<symbol id="${symbolId}" viewBox="0 0 16 16"><clipPath id="${symbolId}-clip"><rect width="16" height="16" rx="2.5"/></clipPath><image href="${escapeXmlAttribute(coverUrl)}" width="16" height="16" preserveAspectRatio="xMidYMid slice" clip-path="url(#${symbolId}-clip)"/></symbol>`
      );
      byFileName[baseName] = { name: symbolId, viewBox: "0 0 16 16" };
      thumbnailCount += 1;
    }

    return {
      byFileName,
      colored: true,
      remap: {
        "file-tree-icon-chevron": {
          name: "file-system-chevron",
          viewBox: "0 0 24 24",
        },
      },
      set: "complete" as const,
      spriteSheet: `<svg data-icon-sprite aria-hidden="true" width="0" height="0">${symbols.join("")}</svg>`,
    };
  }, [currentPath, index, relativePaths]);
  const { model } = useFileTree({
    flattenEmptyDirectories: false,
    icons,
    initialExpansion: "closed",
    // Remounts (folder changes, manifest updates) keep the active filter.
    initialSearchQuery: searchQuery || null,
    initialSelectedPaths: initialSelectedPath ? [initialSelectedPath] : [],
    itemHeight: 28,
    overscan: 12,
    preparedInput,
    renderRowDecoration: ({ row }) => {
      const entry =
        row.kind === "file"
          ? index.files.get(`${currentPath}${row.path}`)
          : index.folders.get(normalizeFolderPath(`${currentPath}${row.path}`));

      if (!entry) return null;

      // The decoration lane renders one <span title>; CSS splits it into
      // aligned Date Modified (::before from title) and Size columns.
      const dateColumn = formatTimestamp(entry.updatedAt ?? entry.createdAt) ?? "—";

      if (entry.kind === "folder") {
        const childCount = index.children.get(entry.path)?.length;

        return {
          text: childCount === undefined ? "—" : `${childCount} ${childCount === 1 ? "item" : "items"}`,
          title: dateColumn,
        };
      }

      return { text: formatByteSize(entry.size) ?? "—", title: dateColumn };
    },
    unsafeCSS: `
      button[data-type='item']:not([data-item-selected]):hover {
        background: color-mix(in oklab, var(--color-accent) 50%, transparent);
      }
      button[data-type='item'][data-item-selected] {
        background: var(--color-primary);
        color: var(--color-primary-foreground);
        /* The primary surface is the opposite of the mode's background, so
           the row's light-dark() icon colors resolve against the opposite
           scheme — light-palette icons on the light pill in dark mode and
           vice versa. */
        color-scheme: var(--fs-selected-color-scheme, normal);
      }
      button[data-type='item'][data-item-selected] *:not([data-icon-token]):not([data-icon-token] *),
      button[data-type='item'][data-item-selected] [data-item-section]::before {
        color: var(--color-primary-foreground) !important;
      }
      [data-item-section='decoration'] > span {
        display: grid;
        grid-template-columns: 11rem 5rem;
        white-space: nowrap;
        /* The size cell is the span's anonymous text item, so alignment
           rides on text-align: the span's right applies to it while the
           date cell (::before) overrides back to left. */
        text-align: right;
      }
      [data-item-section='decoration'] > span::before {
        content: attr(title);
        text-align: left;
      }
      button[data-type='item'][data-item-type='folder'] [data-item-section='content'] {
        display: flex;
        align-items: center;
        min-width: 0;
      }
      button[data-type='item'][data-item-type='folder'] [data-item-section='content']::before {
        content: "";
        flex: none;
        width: 18px;
        height: 14px;
        margin-right: 4px;
        background: url("${FOLDER_GLYPH_DATA_URL}") center / contain no-repeat;
      }
    `,
    onSelectionChange: (selectedPaths) => {
      const relativePath = selectedPaths[0];

      if (!relativePath) {
        onSelect(null);
        return;
      }

      const absolutePath = `${currentPath}${relativePath}`;
      const entry = index.files.get(absolutePath) ?? index.folders.get(normalizeFolderPath(absolutePath)) ?? null;

      onSelect(entry);
    },
  });

  // Thumbnails can resolve after mount (e.g. generated client-side); push
  // sprite updates into the existing model instead of remounting the tree.
  React.useEffect(() => {
    model.setIcons(icons);
  }, [icons, model]);

  // The folders currently expanded in the mounted model, derived from the
  // given path list (the model knows the rows; the paths name the
  // directories to ask about).
  const collectExpandedDirectories = React.useCallback(
    (paths: readonly string[]) => {
      const expandedPaths: string[] = [];

      for (const directoryPath of directoryPathsOf(paths)) {
        const item = model.getItem(directoryPath) ?? model.getItem(`${directoryPath}/`);

        if (item && "isExpanded" in item && item.isExpanded()) {
          expandedPaths.push(directoryPath);
        }
      }
      return expandedPaths;
    },
    [model]
  );

  // Opens every given folder on the mounted model (no-ops on the already
  // open ones).
  const expandDirectories = React.useCallback(
    (directoryPaths: Iterable<string>) => {
      for (const directoryPath of directoryPaths) {
        const item = model.getItem(directoryPath) ?? model.getItem(`${directoryPath}/`);

        if (item && "isExpanded" in item && !item.isExpanded()) {
          item.toggle();
        }
      }
    },
    [model]
  );

  // Sort and filter changes swap the prepared input in place — remounting
  // would reset every folder's disclosure. The folders expanded in the
  // outgoing path list, the selection, and the active search query are
  // captured first and handed back to the reset.
  const appliedPreparedInputRef = React.useRef(preparedInput);
  // Filter bookkeeping: the latest prop (for unmount-time decisions), the
  // state at the last applied reset (for transition detection), and the
  // disclosure to restore once the filters clear.
  const hasActiveFiltersRef = React.useRef(hasActiveFilters);
  const filteredAtLastResetRef = React.useRef(hasActiveFilters);
  const preFilterExpansionRef = React.useRef<readonly string[] | null>(null);

  React.useEffect(() => {
    hasActiveFiltersRef.current = hasActiveFilters;
  });

  React.useEffect(() => {
    const previousPreparedInput = appliedPreparedInputRef.current;

    if (previousPreparedInput === preparedInput) return;
    appliedPreparedInputRef.current = preparedInput;

    const wasFiltered = filteredAtLastResetRef.current;

    filteredAtLastResetRef.current = hasActiveFilters;

    // Filters reveal their matches the way the search session does: every
    // folder on the way to a match opens. The disclosure from just before
    // filtering is kept aside and comes back when the filters clear.
    let expandedPaths: readonly string[];

    if (hasActiveFilters) {
      if (!wasFiltered) {
        preFilterExpansionRef.current = collectExpandedDirectories(previousPreparedInput.paths);
      }
      expandedPaths = [...directoryPathsOf(preparedInput.paths)];
    } else if (wasFiltered) {
      expandedPaths = preFilterExpansionRef.current ?? [];
      preFilterExpansionRef.current = null;
    } else {
      expandedPaths = collectExpandedDirectories(previousPreparedInput.paths);
    }

    const searchValue = model.getSearchValue();

    // The `paths` argument must stay unset: when both are given, resetPaths
    // re-prepares the paths with the comparator the model was CREATED with
    // and rejects the differently-ordered prepared input. Passing only the
    // prepared input makes the reset adopt its path list as-is, and the
    // reset itself carries the selection over.
    model.resetPaths(undefined as unknown as readonly string[], {
      initialExpandedPaths: expandedPaths,
      preparedInput,
    });
    if (searchValue) model.setSearch(searchValue);
  }, [collectExpandedDirectories, hasActiveFilters, model, preparedInput]);

  // View switches and navigation unmount the tree; remember which folders
  // were left expanded and reopen them on the next mount of this folder
  // (before paint, so the restored disclosure never flashes closed). While
  // filters are active their matches are revealed instead, and the
  // remembered disclosure is the pre-filter one.
  React.useLayoutEffect(() => {
    const expansionStore = treeExpansionRef.current!;
    const savedExpansion = expansionStore.get(currentPath) ?? [];

    if (hasActiveFiltersRef.current) {
      preFilterExpansionRef.current = savedExpansion;
      expandDirectories(directoryPathsOf(appliedPreparedInputRef.current.paths));
    } else {
      expandDirectories(savedExpansion);
    }

    return () => {
      expansionStore.set(
        currentPath,
        hasActiveFiltersRef.current
          ? (preFilterExpansionRef.current ?? [])
          : collectExpandedDirectories(appliedPreparedInputRef.current.paths)
      );
    };
  }, [collectExpandedDirectories, currentPath, expandDirectories, treeExpansionRef]);

  // The toolbar search drives the tree's own search session, which filters
  // rows with hide-non-matches semantics and highlights the matched text.
  React.useEffect(() => {
    model.setSearch(searchQuery || null);
  }, [model, searchQuery]);

  // The tree's arrow keys move focus and only select on click/Enter; mirror
  // focus into the (single) selection so arrowing selects like Finder. Shift
  // ranges keep the focused row selected, so they pass through untouched.
  React.useEffect(() => {
    let lastFocusedPath = model.getFocusedPath();

    return model.subscribe(() => {
      const focusedPath = model.getFocusedPath();

      if (focusedPath === lastFocusedPath) return;

      lastFocusedPath = focusedPath;

      if (!focusedPath) return;

      const item = model.getItem(focusedPath);

      if (!item || item.isSelected()) return;

      for (const path of model.getSelectedPaths()) {
        model.getItem(path)?.deselect();
      }
      item.select();
    });
  }, [model]);

  // Rows live in the tree's shadow DOM; composedPath surfaces the row
  // element behind a pointer or keyboard event so it can resolve to a
  // manifest entry.
  const entryFromEvent = (event: React.SyntheticEvent) => {
    for (const target of event.nativeEvent.composedPath()) {
      if (!(target instanceof HTMLElement)) continue;

      const relativePath = target.dataset?.itemPath;

      if (!relativePath) continue;

      const absolutePath = `${currentPath}${relativePath}`;

      return index.files.get(absolutePath) ?? index.folders.get(normalizeFolderPath(absolutePath)) ?? null;
    }
    return null;
  };

  // The tree exposes rows by relative path; directory ids may or may not
  // carry the trailing slash depending on the call site.
  const resolveTreeItem = (relativePath: string) =>
    model.getItem(relativePath) ??
    model.getItem(relativePath.endsWith("/") ? relativePath.slice(0, -1) : `${relativePath}/`);

  // The tree's rows in display order — folders first per level, recursing
  // only into expanded folders — so type-ahead cycles exactly what's on
  // screen. Virtualization keeps this off the DOM; the index and the item
  // handles carry the same information.
  const collectVisibleEntries = () => {
    const visibleEntries: FileSystemEntry[] = [];
    const walk = (folderPath: string) => {
      const children = index.children.get(folderPath) ?? [];

      for (const child of children) {
        if (child.kind !== "folder") continue;

        const item = resolveTreeItem(child.path.slice(currentPath.length));

        if (!item) continue;
        visibleEntries.push(child);
        if ("isExpanded" in item && item.isExpanded()) walk(child.path);
      }
      for (const child of children) {
        if (child.kind === "file") visibleEntries.push(child);
      }
    };

    walk(currentPath);
    return visibleEntries;
  };

  const typeAhead = useEntryTypeAhead();

  return (
    <PierreFileTree
      model={model}
      className="block min-h-0 flex-1"
      // Finder semantics: double-clicking a folder navigates into it and
      // double-clicking a file opens it; a single click still only toggles
      // the folder's disclosure.
      onDoubleClick={(event) => {
        const entry = entryFromEvent(event);

        if (entry) onOpen(entry);
      }}
      // Enter mirrors the other views: navigate into the focused folder or
      // open the focused file. Printable keys run the shared type-ahead
      // over the visible rows.
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          const entry = entryFromEvent(event);

          if (entry) {
            event.preventDefault();
            onOpen(entry);
          }
          return;
        }

        if (!isTypeAheadKey(event)) return;

        const visibleEntries = collectVisibleEntries();
        const focusedPath = model.getFocusedPath()?.replace(/\/$/, "") ?? null;
        const focusedIndex = visibleEntries.findIndex(
          (entry) => entry.path.slice(currentPath.length).replace(/\/$/, "") === focusedPath
        );
        const match = typeAhead(event, visibleEntries, focusedIndex);

        if (!match) return;

        const item = resolveTreeItem(match.path.slice(currentPath.length));

        if (item) {
          model.scrollToPath(item.getPath());
          item.focus();
        }
      }}
      style={
        {
          "--trees-bg-override": "transparent",
          "--trees-border-color-override": "var(--color-border)",
          "--trees-fg-override": "var(--color-foreground)",
          // Match the focus-visible ring used by the tabs and the other
          // views (`ring-2 ring-ring`) instead of the tree's accent blue.
          "--trees-focus-ring-color-override": "var(--color-ring)",
          "--trees-focus-ring-width-override": "2px",
          "--trees-selected-bg-override": "var(--color-primary)",
          "--trees-selected-focused-border-color-override": "var(--color-ring)",
        } as React.CSSProperties
      }
    />
  );
}

function FileSystemColumnsView(props: FileSystemViewProps) {
  const {
    currentPath,
    index,
    loadPreviewImageUrl,
    loadingFolders,
    onOpen,
    onSelect,
    pageUrlCache,
    renderFilePreview,
    selectedEntry,
    selectedPath,
  } = props;
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const rowRefs = React.useRef(new Map<string, HTMLButtonElement>());

  // The selection highlight tracks every keypress; mounting the trailing
  // child column and the preview pane is deferred so holding an arrow key
  // doesn't pay that DOM churn per step.
  const deferredSelectedEntry = React.useDeferredValue(selectedEntry);
  const deferredSelectedPath = React.useDeferredValue(selectedPath);
  const pendingFocusPathRef = React.useRef<string | null>(null);
  const typeAhead = useEntryTypeAhead();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!ARROW_KEYS.has(event.key)) {
      // Type-ahead moves within the active column's rows, like Finder.
      const siblings =
        selectedEntry && selectedPath?.startsWith(currentPath)
          ? (index.children.get(selectedEntry.parentPath) ?? [])
          : (index.children.get(currentPath) ?? []);
      const match = typeAhead(
        event,
        siblings,
        siblings.findIndex((sibling) => sibling.path === selectedPath)
      );

      if (match) {
        onSelect(match);

        const row = rowRefs.current.get(match.path);

        if (row) {
          row.focus();
        } else {
          pendingFocusPathRef.current = match.path;
        }
      }
      return;
    }

    let nextEntry: FileSystemEntry | null | undefined;

    if (!selectedEntry || !selectedPath?.startsWith(currentPath)) {
      nextEntry = index.children.get(currentPath)?.[0];
    } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const siblings = index.children.get(selectedEntry.parentPath) ?? [];
      const currentIndex = siblings.findIndex((sibling) => sibling.path === selectedEntry.path);

      nextEntry = siblings[currentIndex + (event.key === "ArrowUp" ? -1 : 1)];
    } else if (event.key === "ArrowLeft") {
      if (selectedEntry.parentPath !== currentPath) {
        nextEntry = index.folders.get(selectedEntry.parentPath);
      }
    } else if (selectedEntry.kind === "folder") {
      nextEntry = index.children.get(selectedEntry.path)?.[0];
    }

    if (!nextEntry) return;

    onSelect(nextEntry);

    const row = rowRefs.current.get(nextEntry.path);

    if (row) {
      pendingFocusPathRef.current = null;
      row.focus();
    } else {
      // The target row lives in a deferred column that hasn't mounted yet;
      // focus it from the effect below once it exists.
      pendingFocusPathRef.current = nextEntry.path;
    }
    event.preventDefault();
  };

  React.useEffect(() => {
    const path = pendingFocusPathRef.current;

    if (!path) return;

    const row = rowRefs.current.get(path);

    if (row) {
      pendingFocusPathRef.current = null;
      row.focus();
    }
  });

  const columnPaths = React.useMemo(() => {
    const paths = [currentPath];

    if (!deferredSelectedPath?.startsWith(currentPath)) return paths;

    const targetFolder =
      deferredSelectedEntry?.kind === "folder"
        ? deferredSelectedEntry.path
        : (deferredSelectedEntry?.parentPath ?? currentPath);
    const relativePath = targetFolder.slice(currentPath.length);
    let walkedPath = currentPath;

    for (const segment of relativePath.split("/")) {
      if (!segment) continue;
      walkedPath = `${walkedPath}${segment}/`;
      paths.push(walkedPath);
    }
    return paths;
  }, [currentPath, deferredSelectedEntry, deferredSelectedPath]);
  // Roving tabindex: all columns together form a single tab stop (the
  // selected row when its column is mounted, else the first row), so
  // Shift+Tab returns to the toolbar like in the list view.
  const tabStopPath = React.useMemo(() => {
    if (selectedPath) {
      for (const columnPath of columnPaths) {
        if (index.children.get(columnPath)?.some((entry) => entry.path === selectedPath)) {
          return selectedPath;
        }
      }
    }
    return index.children.get(columnPaths[0] ?? "")?.[0]?.path ?? null;
  }, [columnPaths, index, selectedPath]);
  const selectedFile = deferredSelectedEntry?.kind === "file" ? (deferredSelectedEntry as FileEntry) : null;
  const selectedFileSize = selectedFile ? formatByteSize(selectedFile.size) : null;

  React.useEffect(() => {
    const container = scrollContainerRef.current;

    if (container) container.scrollLeft = container.scrollWidth;
  }, [columnPaths.length, deferredSelectedPath]);

  return (
    <ScrollArea orientation="horizontal" viewportRef={scrollContainerRef} viewportClassName="overscroll-x-contain">
      {/* The Content part's ResizeObserver tells the scroll area when the
          trail shrinks (deselect, shallower selection) so the horizontal
          scrollbar hides; the viewport alone only observes its own box. Its
          built-in inline min-width (fit-content) would beat a min-w-full
          class, so the full-width floor is inline too. */}
      <ScrollAreaPrimitive.Content className="flex h-full w-max" style={{ minWidth: "100%" }} onKeyDown={handleKeyDown}>
        {columnPaths.map((columnPath, columnIndex) => (
          <FileSystemColumn
            key={columnPath || "(root)"}
            entries={index.children.get(columnPath) ?? []}
            index={index}
            isLoading={loadingFolders.has(columnPath)}
            onOpen={onOpen}
            onSelect={onSelect}
            rowRefs={rowRefs}
            // Scalar per-column props so the memoized column only
            // re-renders when its own rows change — a selection deeper in
            // the trail leaves ancestor columns untouched.
            selectedChildPath={selectedPath && pathParent(selectedPath) === columnPath ? selectedPath : null}
            tabStopChildPath={tabStopPath && pathParent(tabStopPath) === columnPath ? tabStopPath : null}
            trailChildPath={columnPaths[columnIndex + 1] ?? null}
          />
        ))}
        {selectedFile ? (
          // contain-inline-size zeroes the pane's intrinsic width so its
          // max-content contribution is exactly the min-w-60 floor — matching
          // a column's w-60. Otherwise long filenames or wide thumbnails
          // would nudge the overflowing trail's scroll width as the arrow-key
          // selection alternates between files and folders.
          <ScrollArea
            orientation="vertical"
            className="min-w-60 flex-1 contain-inline-size"
            viewportClassName="flex justify-center p-4"
          >
            <div className="flex w-full max-w-lg flex-col items-stretch gap-3">
              {/* Width derives from the aspect ratio so the thumbnail grows
                  with the pane up to a 20rem height cap. */}
              <div
                className="mx-auto w-full shrink-0"
                style={{
                  maxWidth: `min(100%, ${(selectedFile.previewAspectRatio ?? 0.78) * 20}rem)`,
                }}
              >
                <FileVisual
                  file={selectedFile}
                  className="w-full"
                  loadPreviewImageUrl={loadPreviewImageUrl}
                  pageable
                  pageUrlCache={pageUrlCache}
                  previewAspectRatio={0.78}
                  renderFilePreview={renderFilePreview}
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold break-words">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {fileKindLabel(selectedFile)}
                  {selectedFileSize ? ` - ${selectedFileSize}` : null}
                </div>
              </div>
              <FileSystemInformation entry={selectedFile} index={index} />
            </div>
          </ScrollArea>
        ) : null}
      </ScrollAreaPrimitive.Content>
    </ScrollArea>
  );
}

// Column row geometry (px at the default 16px root font size).
const COLUMN_PADDING = 6; // p-1.5
const COLUMN_ROW_HEIGHT = 28; // h-7
const COLUMN_ROW_GAP = 1; // gap-px
const COLUMN_ROW_STRIDE = COLUMN_ROW_HEIGHT + COLUMN_ROW_GAP;

// Memoized with scalar selection props: pressing into a deep trail only
// re-renders the columns whose rows actually change.
const FileSystemColumn = React.memo(function FileSystemColumn({
  entries,
  index,
  isLoading,
  onOpen,
  onSelect,
  rowRefs,
  selectedChildPath,
  tabStopChildPath,
  trailChildPath,
}: {
  entries: FileSystemEntry[];
  index: FileSystemIndex;
  isLoading: boolean;
  onOpen: (entry: FileSystemEntry) => void;
  onSelect: (entry: FileSystemEntry | null) => void;
  rowRefs: React.RefObject<Map<string, HTMLButtonElement>>;
  selectedChildPath: string | null;
  tabStopChildPath: string | null;
  trailChildPath: string | null;
}) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const { end, start } = useVirtualWindow({
    count: entries.length,
    itemStride: COLUMN_ROW_STRIDE,
    leadingPx: COLUMN_PADDING,
    overscan: 10,
    viewportRef,
  });

  // Keyboard navigation can select a row this column hasn't mounted; scroll
  // it into the viewport so it mounts and the pending-focus effect can land.
  React.useLayoutEffect(() => {
    if (!selectedChildPath) return;

    scrollIndexIntoView({
      index: entries.findIndex((entry) => entry.path === selectedChildPath),
      itemSize: COLUMN_ROW_HEIGHT,
      itemStride: COLUMN_ROW_STRIDE,
      leadingPx: COLUMN_PADDING,
      viewport: viewportRef.current,
    });
  }, [entries, selectedChildPath]);

  return (
    <ScrollArea
      orientation="vertical"
      className="w-60 shrink-0 border-r"
      viewportRef={viewportRef}
      viewportClassName="p-1.5"
      viewportProps={{ "aria-label": "Files", role: "listbox" }}
    >
      {isLoading && entries.length === 0 ? (
        <div className="text-xs text-muted-foreground animate-pulse px-2 py-1.5 motion-reduce:animate-none">
          Loading…
        </div>
      ) : (
        <div
          className="relative"
          style={{
            height: entries.length ? entries.length * COLUMN_ROW_STRIDE - COLUMN_ROW_GAP : undefined,
          }}
        >
          <div className="absolute inset-x-0 flex flex-col gap-px" style={{ top: start * COLUMN_ROW_STRIDE }}>
            {entries.slice(start, end).map((entry) => {
              const isSelected = entry.path === selectedChildPath;
              const isOnTrail = entry.kind === "folder" && entry.path === trailChildPath;

              const coverUrl = entry.kind === "file" ? filePreviewUrls(entry)[0] : undefined;

              return (
                <button
                  key={entry.path}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  // Selected rows sit on the primary surface — the opposite
                  // of the mode's background — so the file-type icon swaps
                  // to the opposite palette.
                  data-file-system-on-primary={isSelected ? "" : undefined}
                  tabIndex={entry.path === tabStopChildPath ? 0 : -1}
                  ref={(element) => {
                    if (element) {
                      rowRefs.current?.set(entry.path, element);
                    } else {
                      rowRefs.current?.delete(entry.path);
                    }
                  }}
                  // Selecting on press (mouse only) starts mounting the
                  // child column a beat before mouseup — the immediacy
                  // @pierre/trees rows have. Touch keeps selection on the
                  // click so scroll gestures don't select.
                  onPointerDown={(event) => {
                    if (event.pointerType === "mouse" && event.button === 0) {
                      onSelect(entry);
                    }
                  }}
                  onClick={() => onSelect(entry)}
                  onDoubleClick={() => onOpen(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onOpen(entry);
                  }}
                  className={cn(
                    "text-sm focus-visible:ring-ring flex h-7 shrink-0 items-center gap-2 rounded-md px-2 py-1 text-left outline-none focus-visible:ring-2",
                    isSelected ? "bg-primary text-primary-foreground" : isOnTrail ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  {entry.kind === "folder" ? (
                    <FileSystemFolderGlyph className="h-3.5 w-auto shrink-0" />
                  ) : coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Cover thumbnails come from caller-provided file preview URLs.
                    <img
                      src={coverUrl}
                      alt=""
                      draggable={false}
                      className="size-4 shrink-0 rounded-[3px] bg-white object-cover"
                    />
                  ) : (
                    <FileTypeIcon fileName={entry.name} className="size-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  {entry.kind === "folder" && folderHasChildren(index, entry) ? (
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className={cn("size-3.5 shrink-0", !isSelected && "text-muted-foreground/60")}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ScrollArea>
  );
});

function FileSystemInformation({ entry, index }: { entry: FileSystemEntry; index: FileSystemIndex }) {
  const rows: Array<[string, string]> = [];
  const created = formatTimestamp(entry.createdAt);
  const updated = formatTimestamp(entry.updatedAt);

  if (created) rows.push(["Created", created]);
  if (updated) rows.push(["Modified", updated]);
  if (entry.kind === "file") {
    const size = formatByteSize(entry.size);

    if (size) rows.push(["Size", size]);
  } else {
    const childCount = index.children.get(entry.path)?.length;

    if (childCount !== undefined) {
      rows.push(["Items", `${childCount}`]);
    }
  }

  if (rows.length === 0) return null;

  return (
    <div className="border-t pt-3">
      <div className="text-xs mb-1.5 font-semibold">Information</div>
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="text-xs flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd className="text-right" suppressHydrationWarning>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Filmstrip geometry (px at the default 16px root font size).
const GALLERY_STRIP_PADDING = 8; // p-2
const GALLERY_TILE_SIZE = 56; // size-14
const GALLERY_TILE_GAP = 6; // gap-1.5
const GALLERY_TILE_STRIDE = GALLERY_TILE_SIZE + GALLERY_TILE_GAP;
// How many visited stages stay mounted so stepping back to a recent file
// restores its already-loaded preview without refetching or re-parsing;
// also bounds the memory the keep-alive pool can hold onto.
const GALLERY_STAGE_POOL_SIZE = 4;
// Of those, how many stay attached to the DOM (the active stage plus the
// two before it, keeping the usual two-or-three-file rotation instant).
// The rest wait detached, costing no layout or style-recalc work until
// they return — their page canvases remount on the way back, so returning
// to a detached stage briefly rebuilds the page content.
const GALLERY_STAGE_ATTACHED_COUNT = 3;

// The preview for one pooled file. Each stage owns its URL resolution and
// viewer state, so a mounted stage is self-contained: the root keeps
// recently shown stages alive (reparented between hosts rather than
// remounted, because the document viewers load in effects and would
// refetch and re-parse on remount) and revisiting one — in the gallery or
// the dialog — skips the presign, download, and parse work instead of
// re-running it behind a spinner. The two variants share one element
// structure, differing only in props and classes, so flipping a mounted
// stage between them keeps the viewer instance.
function FileSystemGalleryStage({
  file,
  getFileUrl,
  loadPreviewImageUrl,
  pageUrlCache,
  renderFilePreview,
  toolbarActions,
  urlCache,
  variant = "stage",
}: {
  file: FileEntry;
  getFileUrl?: (file: FileSystemFileItem) => string | Promise<string>;
  loadPreviewImageUrl?: (file: FileSystemFileItem, pageIndex: number) => Promise<string | null>;
  pageUrlCache?: Map<string, string>;
  renderFilePreview?: (file: FileSystemFileItem) => React.ReactNode;
  /** Rendered in the viewer toolbar in the `"dialog"` variant. */
  toolbarActions?: React.ReactNode;
  urlCache: Map<string, string>;
  /** `"stage"` is toolbar-less in a bordered tile; `"dialog"` shows the full viewer chrome. */
  variant?: "dialog" | "stage";
}) {
  const viewerKind = viewerKindForFile(file);
  // Only viewer-backed stages need a URL; thumbnail stages render from the
  // manifest's preview images, so selecting them never triggers a presign.
  const { isResolving, url } = useResolvedFileUrl(viewerKind ? file : null, getFileUrl, urlCache);
  const isDialog = variant === "dialog";
  const [isDark, setIsDark] = React.useState(false);
  const viewerFrameClassName = cn("size-full", !isDialog && "overflow-hidden rounded-lg border");

  if (viewerKind && isResolving) {
    return <Spinner className="text-muted-foreground size-6" />;
  }
  if (viewerKind === "image" && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Image file previews render caller-provided URLs that may be object or presigned URLs.
      <img src={url} alt={file.name} className="max-h-full max-w-full rounded-lg object-contain" />
    );
  }
  if (viewerKind === "pdf" && url) {
    return (
      <div className={viewerFrameClassName}>
        <React.Suspense fallback={<FileSystemViewerLoading />}>
          <LazyPDFViewer
            src={url}
            className={cn("h-full", isDialog && "min-h-0 overflow-hidden rounded-2xl")}
            fileName={file.name}
            showToolbar={isDialog}
            showUpload={false}
            toolbarActions={toolbarActions}
          />
        </React.Suspense>
      </div>
    );
  }
  if (viewerKind === "docx" && url) {
    return (
      <div className={viewerFrameClassName}>
        <React.Suspense fallback={<FileSystemViewerLoading />}>
          <LazyDocxViewerPreview
            src={url}
            fileName={file.name}
            isDark={isDark}
            className={cn("h-full min-h-0", isDialog && "overflow-hidden rounded-2xl")}
            onIsDarkChange={setIsDark}
            showToolbar={isDialog}
            showUpload={false}
            toolbarActions={toolbarActions}
          />
        </React.Suspense>
      </div>
    );
  }
  if (viewerKind === "xlsx" && url) {
    return (
      <div className={viewerFrameClassName}>
        <React.Suspense fallback={<FileSystemViewerLoading />}>
          <LazyXlsxViewerPreview
            src={url}
            fileName={file.name}
            isDark={isDark}
            className={cn("h-full min-h-0", isDialog && "overflow-hidden rounded-2xl")}
            onIsDarkChange={setIsDark}
            showToolbar={isDialog}
            showUpload={false}
            toolbarActions={toolbarActions}
          />
        </React.Suspense>
      </div>
    );
  }
  if (viewerKind === "csv" && url) {
    return (
      <div className={viewerFrameClassName}>
        <React.Suspense fallback={<FileSystemViewerLoading />}>
          <CsvViewerFromUrl url={url} className={cn("h-full min-h-0", isDialog && "overflow-hidden rounded-2xl")} />
        </React.Suspense>
      </div>
    );
  }
  return (
    <FileVisual
      file={file}
      className="w-56 max-w-full"
      loadPreviewImageUrl={loadPreviewImageUrl}
      pageable
      pageUrlCache={pageUrlCache}
      previewAspectRatio={0.78}
      renderFilePreview={renderFilePreview}
    />
  );
}

function FileSystemGalleryView(props: FileSystemViewProps) {
  const {
    attachedStagePaths,
    entries,
    index,
    onOpen,
    onSelect,
    poolStagePath,
    registerStageHost,
    renderFilePreview,
    selectedEntry,
    selectedPath,
  } = props;
  const stripRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const stripViewportRef = React.useRef<HTMLDivElement | null>(null);
  const typeAhead = useEntryTypeAhead();
  const activeEntry =
    selectedEntry && entries.some((entry) => entry.path === selectedEntry.path) ? selectedEntry : (entries[0] ?? null);
  const activeFile = activeEntry?.kind === "file" ? activeEntry : null;
  // While arrow keys are scrubbing the strip, the center pane shows a
  // spinner; a file is only admitted to the preview pool (mounting its
  // viewer and resolving its URL) once the selection settles so each
  // keystroke stays cheap.
  const settledPath = useSettledValue(activeEntry?.path ?? null, 200);

  React.useEffect(() => {
    if (settledPath) poolStagePath(settledPath);
  }, [poolStagePath, settledPath]);

  // Hosts for the root-owned preview pool: one positioned wrapper per
  // pooled path; the root reparents each live preview into its wrapper.
  // Stable callbacks per path keep React from re-running the host refs on
  // unrelated renders.
  const stageHostRefs = React.useMemo(
    () =>
      new Map(
        attachedStagePaths.map(
          (path) => [path, (element: HTMLElement | null) => registerStageHost(path, element)] as const
        )
      ),
    [attachedStagePaths, registerStageHost]
  );

  const activeFileSize = activeFile ? formatByteSize(activeFile.size) : null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (entries.length === 0) return;

    const currentIndex = activeEntry ? entries.findIndex((entry) => entry.path === activeEntry.path) : -1;

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      const match = typeAhead(event, entries, currentIndex);

      if (match) {
        onSelect(match);
        // The matched tile may be outside the strip's virtual window; the
        // active-tile effect scrolls it in, and focus follows once mounted.
        requestAnimationFrame(() => stripRefs.current.get(match.path)?.focus());
      }
      return;
    }

    const nextEntry = entries[currentIndex === -1 ? 0 : currentIndex + (event.key === "ArrowLeft" ? -1 : 1)];

    if (!nextEntry) return;

    onSelect(nextEntry);
    stripRefs.current.get(nextEntry.path)?.focus();
    event.preventDefault();
  };

  const { end: stripEnd, start: stripStart } = useVirtualWindow({
    count: entries.length,
    horizontal: true,
    itemStride: GALLERY_TILE_STRIDE,
    leadingPx: GALLERY_STRIP_PADDING,
    overscan: 8,
    viewportRef: stripViewportRef,
  });

  // Keep the active tile mounted and visible while scrubbing or when the
  // selection arrives from another view.
  const activePath = activeEntry?.path ?? null;

  React.useLayoutEffect(() => {
    if (!activePath) return;

    scrollIndexIntoView({
      horizontal: true,
      index: entries.findIndex((entry) => entry.path === activePath),
      itemSize: GALLERY_TILE_SIZE,
      itemStride: GALLERY_TILE_STRIDE,
      leadingPx: GALLERY_STRIP_PADDING,
      viewport: stripViewportRef.current,
    });
  }, [activePath, entries]);

  return (
    <div className="flex size-full flex-col" onKeyDown={handleKeyDown}>
      {/* The strip comes first in DOM order (rendered below via order-last)
          so the filmstrip is the view's single tab stop: Shift+Tab exits to
          the toolbar instead of landing inside the embedded viewers. */}
      <ScrollArea
        orientation="horizontal"
        className="order-last h-auto w-full shrink-0 border-t"
        viewportRef={stripViewportRef}
        viewportClassName="p-2"
      >
        <div
          className="relative h-14 min-w-full"
          style={{
            width: entries.length ? entries.length * GALLERY_TILE_STRIDE - GALLERY_TILE_GAP : undefined,
          }}
        >
          <div
            role="listbox"
            aria-label="Files"
            className="absolute inset-y-0 flex items-center gap-1.5"
            style={{ left: stripStart * GALLERY_TILE_STRIDE }}
          >
            {entries.slice(stripStart, stripEnd).map((entry) => {
              const isActive = entry.path === (activeEntry?.path ?? selectedPath);

              return (
                <button
                  key={entry.path}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  ref={(element) => {
                    if (element) {
                      stripRefs.current.set(entry.path, element);
                    } else {
                      stripRefs.current.delete(entry.path);
                    }
                  }}
                  onClick={() => onSelect(entry)}
                  onDoubleClick={() => onOpen(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onOpen(entry);
                  }}
                  title={entry.name}
                  className={cn(
                    "focus-visible:ring-ring flex size-14 shrink-0 items-center justify-center rounded-md border border-transparent p-1 outline-none focus-visible:ring-2",
                    isActive && "border-ring/40 bg-accent"
                  )}
                >
                  {entry.kind === "folder" ? (
                    <FileSystemFolderGlyph className="h-9 w-auto" />
                  ) : (
                    <FileVisual
                      file={entry}
                      className="w-9 rounded-sm"
                      previewAspectRatio={0.78}
                      renderFilePreview={renderFilePreview}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center p-3">
          {activeEntry?.kind === "folder" ? (
            <FileSystemFolderGlyph className="h-40 max-h-full w-auto drop-shadow-md" />
          ) : activeFile && !attachedStagePaths.includes(activeFile.path) ? (
            <Spinner className="text-muted-foreground size-6" />
          ) : null}
          {/* Inactive hosts hide via `visibility` + `opacity`, never
              `display`: the document viewers size pages off ResizeObserver
              measurements, and display:none would collapse them to zero
              width — every reveal would re-lay-out and re-rasterize behind
              a blank pane. Stacking absolutely keeps each hidden stage at
              its real size so revealing one is pure paint. `opacity-0`
              matters: descendants can override an inherited
              visibility:hidden with their own visibility:visible (the
              spreadsheet grid's cell-selection overlay does), but nothing
              can opt out of an ancestor's zero opacity. `inert` keeps the
              hidden viewer's focusables out of reach. */}
          {attachedStagePaths.map((path) => {
            const isActiveStage = path === activeFile?.path;

            return (
              <div
                key={path}
                ref={stageHostRefs.get(path)}
                {...({ inert: !isActiveStage || undefined } as React.HTMLAttributes<HTMLDivElement>)}
                className={cn(
                  "absolute inset-0 flex items-center justify-center p-3",
                  !isActiveStage && "invisible opacity-0"
                )}
              />
            );
          })}
        </div>
        {activeEntry ? (
          <ScrollArea
            orientation="vertical"
            className="hidden w-64 shrink-0 border-l sm:block"
            viewportClassName="flex flex-col gap-3 p-4"
          >
            <div className="flex items-center gap-3">
              {activeFile ? (
                <FileVisual
                  file={activeFile}
                  className={cn("shrink-0 rounded-sm", (activeFile.previewAspectRatio ?? 0.78) > 1.2 ? "w-16" : "w-9")}
                  previewAspectRatio={0.78}
                  renderFilePreview={renderFilePreview}
                />
              ) : (
                <FileSystemFolderGlyph className="h-8 w-auto shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold break-words">{activeEntry.name}</div>
                <div className="text-xs text-muted-foreground">
                  {activeFile ? fileKindLabel(activeFile) : "Folder"}
                  {activeFileSize ? ` - ${activeFileSize}` : null}
                </div>
              </div>
            </div>
            <FileSystemInformation entry={activeEntry} index={index} />
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
}
