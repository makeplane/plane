"use client";

import * as React from "react";
import { createPluginRegistration, refreshPages } from "@embedpdf/core";
import { EmbedPDF, useRegistry } from "@embedpdf/core/react";
import type { PdfDocumentObject, PdfEngine, Rect, Rotation } from "@embedpdf/models";
import {
  DocumentManagerPluginPackage,
  useActiveDocument,
  useDocumentManagerCapability,
} from "@embedpdf/plugin-document-manager/react";
import {
  GlobalPointerProvider,
  InteractionManagerPluginPackage,
  PagePointerProvider,
} from "@embedpdf/plugin-interaction-manager/react";
import { RenderLayer, RenderPluginPackage } from "@embedpdf/plugin-render/react";
import { Rotate, RotatePluginPackage } from "@embedpdf/plugin-rotate/react";
import {
  ScrollPluginPackage,
  ScrollStrategy,
  useScroll,
  useScrollPlugin,
  type PageLayout,
  type ScrollerLayout,
  type VirtualItem,
} from "@embedpdf/plugin-scroll/react";
import { SearchLayer, SearchPluginPackage, useSearch } from "@embedpdf/plugin-search/react";
import {
  CopyToClipboard,
  SelectionPluginPackage,
  useSelectionCapability,
  useSelectionPlugin,
} from "@embedpdf/plugin-selection/react";
import {
  ThumbImg,
  ThumbnailPluginPackage,
  useThumbnailCapability,
  useThumbnailPlugin,
  type ThumbMeta,
} from "@embedpdf/plugin-thumbnail/react";
import { TilingLayer, TilingPluginPackage } from "@embedpdf/plugin-tiling/react";
import {
  useIsViewportGated,
  useViewportCapability,
  useViewportElement,
  useViewportRef,
  ViewportElementContext,
  ViewportPluginPackage,
} from "@embedpdf/plugin-viewport/react";
import { useZoom, ZoomPluginPackage } from "@embedpdf/plugin-zoom/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Download01Icon,
  MinusSignCircleIcon,
  MoreHorizontalIcon,
  PlusSignCircleIcon,
  RotateClockwiseIcon,
  Search01Icon,
  SidebarLeftIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { flushSync } from "react-dom";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import {
  DocumentViewerSidebarSkeleton,
  DocumentViewerThumbnailSidebar,
  useElementWidth,
  useInlineThumbnailSidebar,
} from "./document-viewer-sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Separator } from "./separator";
import { Spinner } from "./spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { loadSharedPdfEngine } from "../pdf-thumbnail-utils";

export type PDFViewerPageOverlayProps = {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  scale: number;
  rotation: number;
};

export type PDFViewerHandle = {
  scrollToPage: (pageNumber: number, options?: ScrollIntoViewOptions) => void;
  scrollToPageArea: (
    pageNumber: number,
    area: { top: number; left?: number; width?: number; height?: number },
    options?: ScrollToOptions
  ) => void;
  getViewportElement: () => HTMLDivElement | null;
};

export type PDFViewerProps = {
  className?: string;
  defaultZoom?: number;
  fileName?: string;
  showDownload?: boolean;
  showToolbar?: boolean;
  showRotateControls?: boolean;
  showUpload?: boolean;
  src?: string;
  toolbarActions?: React.ReactNode;
  pageClassName?: (pageNumber: number) => string | undefined;
  renderPageOverlay?: (props: PDFViewerPageOverlayProps) => React.ReactNode;
  onActivePageChange?: (pageNumber: number) => void;
  onDocumentLoadSuccess?: (numPages: number) => void;
  onPdfUpload?: (file: File) => void;
  onPagePointerDown?: (event: React.PointerEvent<HTMLDivElement>, pageNumber: number) => void;
  onPagePointerMove?: (event: React.PointerEvent<HTMLDivElement>, pageNumber: number) => void;
  onPagePointerUp?: (event: React.PointerEvent<HTMLDivElement>, pageNumber: number) => void;
  onPagePointerCancel?: (event: React.PointerEvent<HTMLDivElement>, pageNumber: number) => void;
};

const DEFAULT_ZOOM = 1;
const ZOOM_OPTIONS = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const PAGE_GAP = 24;
const THUMBNAIL_PAGE_WIDTH = 92;
const THUMBNAIL_IMAGE_PADDING = 8;
const THUMBNAIL_WIDTH = THUMBNAIL_PAGE_WIDTH + THUMBNAIL_IMAGE_PADDING * 2;
const THUMBNAIL_LABEL_HEIGHT = 24;
const THUMBNAIL_GAP = 12;
const THUMBNAIL_PANE_PADDING_Y = 16;
const THUMBNAIL_SIDEBAR_WIDTH_CLASS = "w-40";
const THUMBNAIL_SIDEBAR_CLOSED_CLASS = "-ml-40";
const PAGE_BASE_RENDER_MAX_SCALE = 1;
const PAGE_BASE_RENDER_DPR = 1;
const PDF_SEARCH_DEBOUNCE_MS = 300;
const TEXT_SELECTION_BACKGROUND = "rgba(59, 130, 246, 0.14)";
const THUMBNAIL_FOCUS_RING_CLASS =
  "group-focus-visible/pdf-thumbnail-sidebar:ring-2 group-focus-visible/pdf-thumbnail-sidebar:ring-ring group-focus-visible/pdf-thumbnail-sidebar:ring-offset-1 group-focus-visible/pdf-thumbnail-sidebar:ring-offset-background";

type PageRotationDeltas = Map<number, Rotation>;
type ThumbnailSelectionMode = "replace" | "toggle" | "range";

function getPageIndexRange(from: number, to: number): Set<number> {
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const range = new Set<number>();

  for (let pageIndex = start; pageIndex <= end; pageIndex += 1) {
    range.add(pageIndex);
  }

  return range;
}

function arePageIndexSetsEqual(left: Set<number>, right: Set<number>) {
  if (left.size !== right.size) return false;

  for (const value of left) {
    if (!right.has(value)) return false;
  }

  return true;
}

function normalizeRotation(rotation: number): Rotation {
  return (((rotation % 4) + 4) % 4) as Rotation;
}

function useSharedPdfEngine() {
  const [engine, setEngine] = React.useState<PdfEngine | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    loadSharedPdfEngine().then(
      (loadedEngine) => {
        if (!cancelled) setEngine(loadedEngine);
      },
      (loadError: Error) => {
        if (!cancelled) setError(loadError);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { engine, error };
}

function rotationToDegrees(rotation: Rotation) {
  return (rotation as number) * 90;
}

function normalizeDegrees(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

function ensurePdfExtension(fileName: string) {
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

function getPdfDownloadFileName(fileName: string | undefined, src: string) {
  if (fileName?.trim()) return ensurePdfExtension(fileName.trim());

  const pathname = src.split(/[?#]/)[0] ?? "";
  const rawName = pathname.split("/").pop() || "document.pdf";

  try {
    return ensurePdfExtension(decodeURIComponent(rawName));
  } catch {
    return ensurePdfExtension(rawName);
  }
}

function getRotatedPdfDownloadFileName(fileName: string) {
  return fileName.replace(/\.pdf$/i, "-rotated.pdf");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function downloadPdfWithPageRotations({
  fileName,
  pageRotationDeltas,
  src,
}: {
  fileName: string;
  pageRotationDeltas: PageRotationDeltas;
  src: string;
}) {
  const response = await fetch(src);

  if (!response.ok) {
    throw new Error(`Failed to download PDF (${response.status})`);
  }

  if (pageRotationDeltas.size === 0) {
    downloadBlob(await response.blob(), fileName);
    return;
  }

  const [{ PDFDocument, degrees }, pdfBytes] = await Promise.all([import("pdf-lib"), response.arrayBuffer()]);
  const pdfDocument = await PDFDocument.load(pdfBytes);

  pdfDocument.getPages().forEach((page, pageIndex) => {
    const rotationDelta = pageRotationDeltas.get(pageIndex);

    if (!rotationDelta) return;

    page.setRotation(degrees(normalizeDegrees(page.getRotation().angle + rotationToDegrees(rotationDelta))));
  });

  const nextPdfBytes = await pdfDocument.save();
  const nextPdfBuffer = new ArrayBuffer(nextPdfBytes.byteLength);
  new Uint8Array(nextPdfBuffer).set(nextPdfBytes);

  downloadBlob(new Blob([nextPdfBuffer], { type: "application/pdf" }), getRotatedPdfDownloadFileName(fileName));
}

function getThumbnailMetaForPage({
  page,
  pageIndex,
  rotation,
  width,
  imagePadding,
  labelHeight,
  top,
}: {
  page: PdfDocumentObject["pages"][number];
  pageIndex: number;
  rotation: Rotation;
  width: number;
  imagePadding: number;
  labelHeight: number;
  top: number;
}): ThumbMeta {
  const innerWidth = Math.max(1, width - imagePadding * 2);
  const pageWidth = rotation % 2 === 1 ? page.size.height : page.size.width;
  const pageHeight = rotation % 2 === 1 ? page.size.width : page.size.height;
  const imageHeight = Math.round(innerWidth * (pageHeight / pageWidth));
  const wrapperHeight = imagePadding + imageHeight + imagePadding + labelHeight;

  return {
    pageIndex,
    width: innerWidth,
    height: imageHeight,
    wrapperHeight,
    top,
    labelHeight,
    padding: imagePadding,
  };
}

function buildThumbnailLayout({
  basePageRotations,
  pageRotationDeltas,
  pdfDocument,
  width,
  gap,
  imagePadding,
  labelHeight,
  paddingY,
}: {
  basePageRotations: Rotation[];
  pageRotationDeltas: PageRotationDeltas;
  pdfDocument: PdfDocumentObject | null;
  width: number;
  gap: number;
  imagePadding: number;
  labelHeight: number;
  paddingY: number;
}) {
  if (!pdfDocument) return null;

  let top = paddingY;
  const items = pdfDocument.pages.map((page, pageIndex) => {
    const basePageRotation = basePageRotations[pageIndex] ?? normalizeRotation(page.rotation);
    const pageRotation = normalizeRotation(basePageRotation + (pageRotationDeltas.get(pageIndex) ?? 0));
    const meta = getThumbnailMetaForPage({
      page,
      pageIndex,
      rotation: pageRotation,
      width,
      imagePadding,
      labelHeight,
      top,
    });

    top += meta.wrapperHeight + gap;
    return meta;
  });

  return {
    items,
    totalHeight: items.length ? top - gap + paddingY : paddingY * 2,
  };
}

function getVisibleThumbnailItems({
  buffer,
  clientHeight,
  items,
  scrollTop,
}: {
  buffer: number;
  clientHeight: number;
  items: ThumbMeta[];
  scrollTop: number;
}) {
  if (items.length === 0) return [];
  if (clientHeight <= 0) return items.slice(0, Math.min(items.length, buffer * 2));

  const viewportBottom = scrollTop + clientHeight;
  let start = items.findIndex((item) => item.top + item.wrapperHeight >= scrollTop);

  if (start === -1) start = items.length - 1;

  let end = start;
  while (end < items.length && items[end].top <= viewportBottom) {
    end += 1;
  }

  return items.slice(Math.max(0, start - buffer), Math.min(items.length, end + buffer));
}

function PDFViewerLoadingSkeleton({ sidebarOpen, sidebarInline }: { sidebarOpen: boolean; sidebarInline: boolean }) {
  return (
    <div className="bg-muted/30 absolute inset-0 z-20 flex">
      {sidebarOpen ? (
        <DocumentViewerSidebarSkeleton className={THUMBNAIL_SIDEBAR_WIDTH_CLASS} inline={sidebarInline} />
      ) : null}
      <div className="grid min-w-0 flex-1 place-items-center">
        <Spinner className="size-4" />
      </div>
    </div>
  );
}

// Rendered while the engine or document is not ready: same frame as the
// full viewer, with only the upload control usable.
function PDFViewerFallbackShell({
  className,
  showToolbar,
  showUpload,
  sidebarOpen,
  state,
  onUploadFile,
}: {
  className?: string;
  showToolbar: boolean;
  showUpload: boolean;
  sidebarOpen: boolean;
  state: "loading" | "error" | "empty";
  onUploadFile?: (file: File) => void;
}) {
  return (
    <div
      data-slot="pdf-viewer"
      className={cn("bg-background flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden", className)}
    >
      {showToolbar ? (
        <div className="bg-background flex min-h-12 flex-wrap items-center justify-end gap-2 border-b px-3 py-2">
          {showUpload && onUploadFile ? <PDFViewerFileActionsMenu onUploadFile={onUploadFile} showUpload /> : null}
        </div>
      ) : null}
      <div className="bg-muted/30 relative flex min-h-0 flex-1 overflow-hidden">
        {state === "loading" ? <PDFViewerLoadingSkeleton sidebarInline sidebarOpen={sidebarOpen} /> : null}
        {state === "error" ? (
          <div className="bg-background text-sm text-muted-foreground absolute inset-0 z-20 grid place-items-center p-6">
            Unable to load the PDF preview.
          </div>
        ) : null}
        {state === "empty" ? (
          <div className="bg-background text-sm text-muted-foreground absolute inset-0 z-20 grid place-items-center p-6 text-center">
            <div className="max-w-sm space-y-3">
              <div className="text-foreground font-medium">Upload a PDF to preview</div>
              <div>
                Pass a PDF URL with the <code>src</code> prop or use the upload control.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ToolbarTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function PDFViewerFileActionsMenu({
  downloadDisabled,
  isPreparingDownload = false,
  onDownload,
  onUploadFile,
  showDownload = false,
  showUpload = false,
}: {
  downloadDisabled?: boolean;
  isPreparingDownload?: boolean;
  onDownload?: () => void;
  onUploadFile?: (file: File) => void;
  showDownload?: boolean;
  showUpload?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (!showDownload && !showUpload) return null;

  return (
    <>
      {showUpload && onUploadFile ? (
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const nextFile = event.target.files?.[0];

            if (nextFile) {
              onUploadFile(nextFile);
              event.currentTarget.value = "";
            }
          }}
        />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Open PDF actions">
            <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {showDownload && onDownload ? (
            <DropdownMenuItem disabled={downloadDisabled} onClick={onDownload}>
              {isPreparingDownload ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Download01Icon} className="size-4" />
              )}
              Download
            </DropdownMenuItem>
          ) : null}
          {showUpload && onUploadFile ? (
            <DropdownMenuItem onClick={() => inputRef.current?.click()}>
              <HugeiconsIcon icon={Upload01Icon} className="size-4" />
              Upload
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function PDFViewerPageNumberControl({
  activePage,
  controlsDisabled,
  numPages,
  onPageChange,
}: {
  activePage: number;
  controlsDisabled: boolean;
  numPages: number;
  onPageChange: (pageNumber: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const displayPage = numPages ? activePage : 1;
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftPage, setDraftPage] = React.useState(() => String(displayPage));

  React.useEffect(() => {
    if (!isEditing) return;

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditing]);

  const applyPageDraft = React.useCallback(
    (value: string) => {
      const trimmedValue = value.trim();

      if (!trimmedValue) return;

      const parsedPage = Number(trimmedValue);

      if (!Number.isInteger(parsedPage)) return;

      onPageChange(Math.min(Math.max(parsedPage, 1), Math.max(numPages, 1)));
    },
    [numPages, onPageChange]
  );

  return (
    <div className="text-sm flex items-center whitespace-nowrap text-primary">
      <span>Page</span>
      {isEditing ? (
        <Input
          ref={inputRef}
          aria-label="Page number"
          inputMode="numeric"
          pattern="[0-9]*"
          size="sm"
          value={draftPage}
          className="mx-1 w-14 min-w-14 rounded-md [&_[data-slot=input]]:text-center"
          onBlur={() => setIsEditing(false)}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            const nextValue = event.target.value;

            setDraftPage(nextValue);
            applyPageDraft(nextValue);
          }}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
        />
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-normal"
          aria-label={`Current page ${displayPage}. Edit page number`}
          disabled={controlsDisabled || !numPages}
          onClick={() => {
            setDraftPage(String(displayPage));
            setIsEditing(true);
          }}
        >
          {displayPage}
        </Button>
      )}
      <span>of {numPages || "–"}</span>
    </div>
  );
}

function PDFViewerSearchControl({ documentId, controlsDisabled }: { documentId: string; controlsDisabled: boolean }) {
  const { state, provides } = useSearch(documentId);
  const { provides: scroll } = useScroll(documentId);
  const [searchDraft, setSearchDraft] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const providesRef = React.useRef(provides);
  const scrollRef = React.useRef(scroll);
  const searchRequestIdRef = React.useRef(0);
  const hasActiveQuery = Boolean(searchQuery.trim());
  const resultLabel = isSearching
    ? "Searching"
    : !hasActiveQuery
      ? "No search"
      : state.total
        ? `${state.activeResultIndex + 1} / ${state.total}`
        : "No results";

  const scrollToResult = React.useCallback(
    (index: number) => {
      const result = state.results[index];

      if (!result || !scroll) return;

      const firstRect = result.rects[0];

      scroll.scrollToPage({
        pageNumber: result.pageIndex + 1,
        ...(firstRect
          ? {
              pageCoordinates: {
                x: firstRect.origin.x,
                y: firstRect.origin.y,
              },
              alignY: 30,
            }
          : {}),
        behavior: "auto",
      });
    },
    [scroll, state.results]
  );

  React.useEffect(() => {
    providesRef.current = provides;
    scrollRef.current = scroll;
  }, [provides, scroll]);

  const runSearch = React.useCallback((rawQuery: string) => {
    const query = rawQuery.trim();
    const requestId = searchRequestIdRef.current + 1;
    searchRequestIdRef.current = requestId;
    setSearchQuery(query);

    const searchProvider = providesRef.current;
    const scrollProvider = scrollRef.current;

    if (!searchProvider) {
      setIsSearching(false);
      return;
    }

    if (!query) {
      searchProvider.stopSearch();
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchProvider.startSearch();
    searchProvider.searchAllPages(query).wait(
      (result) => {
        if (searchRequestIdRef.current !== requestId) return;

        const firstResult = result.results[0];

        if (firstResult && scrollProvider) {
          searchProvider.goToResult(0);
          const firstRect = firstResult.rects[0];

          scrollProvider.scrollToPage({
            pageNumber: firstResult.pageIndex + 1,
            ...(firstRect
              ? {
                  pageCoordinates: {
                    x: firstRect.origin.x,
                    y: firstRect.origin.y,
                  },
                  alignY: 30,
                }
              : {}),
            behavior: "auto",
          });
        }
        setIsSearching(false);
      },
      () => {
        if (searchRequestIdRef.current !== requestId) return;
        setIsSearching(false);
      }
    );
  }, []);

  React.useEffect(() => {
    if (!searchDraft.trim()) return;

    const timeoutId = window.setTimeout(() => {
      runSearch(searchDraft);
    }, PDF_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [runSearch, searchDraft]);

  const handleSearchDraftChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextDraft = event.target.value;

      setSearchDraft(nextDraft);

      if (nextDraft.trim()) {
        setIsSearching(true);
        return;
      }

      searchRequestIdRef.current += 1;
      setSearchQuery("");
      setIsSearching(false);
      provides?.stopSearch();
    },
    [provides]
  );

  const clearSearch = React.useCallback(() => {
    searchRequestIdRef.current += 1;
    setSearchDraft("");
    setSearchQuery("");
    setIsSearching(false);
    provides?.stopSearch();
  }, [provides]);

  const navigate = React.useCallback(
    (direction: 1 | -1) => {
      if (!provides || state.total === 0) return;

      const index = direction === 1 ? provides.nextResult() : provides.previousResult();

      scrollToResult(index);
    },
    [provides, scrollToResult, state.total]
  );

  return (
    <Popover>
      <ToolbarTooltip label="Search text">
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Search text" disabled={controlsDisabled}>
            <HugeiconsIcon icon={Search01Icon} className="size-4" />
          </Button>
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent align="end" className="w-72">
        <div className="space-y-3">
          <Input
            placeholder="Search text"
            value={searchDraft}
            onChange={handleSearchDraftChange}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;

              event.preventDefault();
              if (event.shiftKey && state.total) {
                navigate(-1);
              } else if (state.total) {
                navigate(1);
              } else if (searchDraft.trim()) {
                runSearch(searchDraft);
              }
            }}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground min-w-0">
              <div className="truncate">
                {state.total ? (
                  <>
                    <span className="text-primary">{state.activeResultIndex + 1}</span>
                    {` / ${state.total}`}
                  </>
                ) : (
                  resultLabel
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous result"
                disabled={isSearching || state.total === 0}
                onClick={() => navigate(-1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next result"
                disabled={isSearching || state.total === 0}
                onClick={() => navigate(1)}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={clearSearch}>
              Clear
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PDFViewerThumbnails({
  basePageRotations,
  documentId,
  activePage,
  pageCount,
  pageRotationDeltas,
  pdfDocument,
  selectedPageIndexes,
  onSelectPage,
}: {
  basePageRotations: Rotation[];
  documentId: string;
  activePage: number;
  pageCount: number;
  pageRotationDeltas: PageRotationDeltas;
  pdfDocument: PdfDocumentObject | null;
  selectedPageIndexes: Set<number>;
  onSelectPage: (pageNumber: number, mode: ThumbnailSelectionMode) => void;
}) {
  const thumbnailListboxId = React.useId();
  const activeDescendantId = activePage > 0 ? `${thumbnailListboxId}-page-${activePage}` : undefined;

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (pageCount < 1) return;

      const currentPage = activePage > 0 ? activePage : 1;
      let nextPage: number | null = null;

      if (event.key === "ArrowDown") {
        nextPage = Math.min(pageCount, currentPage + 1);
      } else if (event.key === "ArrowUp") {
        nextPage = Math.max(1, currentPage - 1);
      } else if (event.key === "Home") {
        nextPage = 1;
      } else if (event.key === "End") {
        nextPage = pageCount;
      } else if (event.key === " ") {
        event.preventDefault();
        onSelectPage(currentPage, "toggle");
        return;
      }

      if (nextPage === null) return;

      event.preventDefault();
      onSelectPage(nextPage, event.shiftKey ? "range" : "replace");
    },
    [activePage, onSelectPage, pageCount]
  );

  return (
    <PDFViewerThumbnailScrollArea
      activeDescendantId={activeDescendantId}
      basePageRotations={basePageRotations}
      documentId={documentId}
      onKeyDown={handleKeyDown}
      pageRotationDeltas={pageRotationDeltas}
      pdfDocument={pdfDocument}
    >
      {(meta: ThumbMeta) => {
        const pageNumber = meta.pageIndex + 1;
        const isActive = pageNumber === activePage;
        const isSelected = selectedPageIndexes.has(meta.pageIndex);
        const imagePadding = meta.padding ?? 0;
        const pageRotationDelta = pageRotationDeltas.get(meta.pageIndex) ?? 0;
        const thumbnailImageStyle: React.CSSProperties =
          pageRotationDelta % 2 === 1
            ? {
                height: meta.width,
                transform: `rotate(${rotationToDegrees(pageRotationDelta)}deg)`,
                width: meta.height,
              }
            : {
                height: meta.height,
                transform: pageRotationDelta === 0 ? undefined : `rotate(${rotationToDegrees(pageRotationDelta)}deg)`,
                width: meta.width,
              };

        return (
          <div
            key={meta.pageIndex}
            data-pdf-viewer-thumbnail={pageNumber}
            className={cn("absolute right-0 left-0 flex justify-center", isActive && "z-10")}
            style={{ top: meta.top, height: meta.wrapperHeight }}
          >
            <div
              id={`${thumbnailListboxId}-page-${pageNumber}`}
              role="option"
              data-pdf-viewer-thumbnail-option={pageNumber}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Page ${pageNumber}`}
              aria-posinset={pageNumber}
              aria-selected={isSelected}
              aria-setsize={pageCount}
              data-selected={isSelected ? "" : undefined}
              className={cn(
                "text-xs hover:bg-sidebar-accent flex h-full w-full cursor-default flex-col items-center justify-between rounded-md px-2 py-0 transition-shadow outline-none select-none",
                isActive || isSelected ? "bg-sidebar-accent text-foreground" : "text-muted-foreground",
                isActive && THUMBNAIL_FOCUS_RING_CLASS
              )}
              onClick={(event) => {
                const mode = event.shiftKey ? "range" : event.metaKey || event.ctrlKey ? "toggle" : "replace";

                onSelectPage(pageNumber, mode);
              }}
            >
              <span
                className="mt-0 flex items-center justify-center overflow-hidden rounded-md bg-transparent"
                style={{
                  width: meta.width + imagePadding * 2,
                  height: meta.height + imagePadding * 2,
                  padding: imagePadding,
                }}
              >
                <ThumbImg
                  documentId={documentId}
                  meta={meta}
                  className="block rounded-sm object-contain"
                  style={thumbnailImageStyle}
                />
              </span>
              <span className="flex items-center justify-center tabular-nums" style={{ height: meta.labelHeight }}>
                <span className="flex min-w-5 items-center justify-center px-1.5 text-center leading-5">
                  {pageNumber}
                </span>
              </span>
            </div>
          </div>
        );
      }}
    </PDFViewerThumbnailScrollArea>
  );
}

function PDFViewerThumbnailScrollArea({
  activeDescendantId,
  basePageRotations,
  children,
  documentId,
  onKeyDown,
  pageRotationDeltas,
  pdfDocument,
}: {
  activeDescendantId?: string;
  basePageRotations: Rotation[];
  children: (meta: ThumbMeta) => React.ReactNode;
  documentId: string;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  pageRotationDeltas: PageRotationDeltas;
  pdfDocument: PdfDocumentObject | null;
}) {
  const { plugin: thumbnailPlugin } = useThumbnailPlugin();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [viewportMetrics, setViewportMetrics] = React.useState({
    clientHeight: 0,
    scrollTop: 0,
  });
  const thumbnailScope = React.useMemo(
    () => thumbnailPlugin?.provides().forDocument(documentId) ?? null,
    [documentId, thumbnailPlugin]
  );

  const windowState = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        if (!thumbnailScope) return () => undefined;

        return thumbnailScope.onWindow(() => onStoreChange());
      },
      [thumbnailScope]
    ),
    React.useCallback(() => thumbnailScope?.getWindow() ?? null, [thumbnailScope]),
    () => null
  );
  const hasWindowState = Boolean(windowState);
  const paddingY = thumbnailPlugin?.cfg.paddingY ?? 0;
  const thumbnailLayout = React.useMemo(
    () =>
      buildThumbnailLayout({
        basePageRotations,
        pageRotationDeltas,
        pdfDocument,
        width: thumbnailPlugin?.cfg.width ?? THUMBNAIL_WIDTH,
        gap: thumbnailPlugin?.cfg.gap ?? THUMBNAIL_GAP,
        imagePadding: thumbnailPlugin?.cfg.imagePadding ?? 0,
        labelHeight: thumbnailPlugin?.cfg.labelHeight ?? THUMBNAIL_LABEL_HEIGHT,
        paddingY,
      }),
    [basePageRotations, pageRotationDeltas, pdfDocument, paddingY, thumbnailPlugin]
  );
  const effectiveWindowState = React.useMemo(() => {
    if (!thumbnailLayout) return windowState;

    const items = getVisibleThumbnailItems({
      buffer: thumbnailPlugin?.cfg.buffer ?? 3,
      clientHeight: viewportMetrics.clientHeight,
      items: thumbnailLayout.items,
      scrollTop: viewportMetrics.scrollTop,
    });

    return {
      start: items[0]?.pageIndex ?? -1,
      end: items.at(-1)?.pageIndex ?? -1,
      items,
      totalHeight: thumbnailLayout.totalHeight,
    };
  }, [thumbnailLayout, thumbnailPlugin, viewportMetrics, windowState]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !thumbnailScope) return;

    const updateWindow = () => {
      setViewportMetrics({
        clientHeight: viewport.clientHeight,
        scrollTop: viewport.scrollTop,
      });
      thumbnailScope.updateWindow(viewport.scrollTop, viewport.clientHeight);
    };

    viewport.addEventListener("scroll", updateWindow);
    const frame = window.requestAnimationFrame(updateWindow);

    return () => {
      window.cancelAnimationFrame(frame);
      viewport.removeEventListener("scroll", updateWindow);
    };
  }, [thumbnailScope]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !thumbnailScope) return;

    const resizeObserver = new ResizeObserver(() => {
      setViewportMetrics({
        clientHeight: viewport.clientHeight,
        scrollTop: viewport.scrollTop,
      });
      thumbnailScope.updateWindow(viewport.scrollTop, viewport.clientHeight);
    });

    resizeObserver.observe(viewport);

    return () => resizeObserver.disconnect();
  }, [thumbnailScope]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !thumbnailScope) return;

    thumbnailScope.updateWindow(viewport.scrollTop, viewport.clientHeight);
  }, [thumbnailLayout, thumbnailScope, windowState]);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !thumbnailScope || !hasWindowState) return;

    return thumbnailScope.onScrollTo(({ top, behavior }) => {
      viewport.scrollTo({ top, behavior });
    });
  }, [hasWindowState, thumbnailScope]);

  return (
    <ScrollArea
      className="h-full w-full"
      orientation="vertical"
      scrollFade
      viewportClassName="group/pdf-thumbnail-sidebar px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
      viewportProps={{
        "aria-activedescendant": activeDescendantId,
        "aria-label": "PDF pages",
        "aria-multiselectable": true,
        onKeyDown,
        onMouseDown: (event) => {
          event.currentTarget.focus({ preventScroll: true });
        },
        role: "listbox",
        style: {
          paddingBottom: paddingY,
          paddingTop: paddingY,
        },
        tabIndex: 0,
      }}
      viewportRef={viewportRef}
    >
      <div className="relative" style={{ height: effectiveWindowState?.totalHeight ?? 0 }}>
        {effectiveWindowState?.items.map((meta) => children(meta))}
      </div>
    </ScrollArea>
  );
}

function PDFViewerScrollAreaViewport({
  children,
  className,
  documentId,
}: {
  children: React.ReactNode;
  className?: string;
  documentId: string;
}) {
  const viewportRef = useViewportRef(documentId);
  const { provides: viewport } = useViewportCapability();
  const isGated = useIsViewportGated(documentId);
  const viewportGap = viewport?.getViewportGap() ?? 0;

  return (
    <ViewportElementContext.Provider value={viewportRef}>
      <ScrollArea
        className={className}
        orientation="both"
        viewportClassName="relative select-none selection:bg-transparent selection:text-inherit"
        viewportProps={{
          style: {
            padding: viewportGap,
          },
        }}
        viewportRef={viewportRef}
      >
        {isGated ? null : children}
      </ScrollArea>
    </ViewportElementContext.Provider>
  );
}

// Captures the scrollable viewport element so the imperative handle can expose
// it.
function PDFViewerViewportBridge({
  viewportElementRef,
}: {
  viewportElementRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  const elementRef = useViewportElement();

  React.useEffect(() => {
    viewportElementRef.current = elementRef?.current ?? null;
  });

  return null;
}

function PDFViewerTextSelectionLayer({
  documentId,
  pageIndex,
  scale,
}: {
  documentId: string;
  pageIndex: number;
  scale: number;
}) {
  const { plugin: selectionPlugin } = useSelectionPlugin();
  const [rects, setRects] = React.useState<Rect[]>([]);

  React.useEffect(() => {
    if (!selectionPlugin) return;

    return selectionPlugin.registerSelectionOnPage({
      documentId,
      pageIndex,
      onRectsChange: ({ rects: nextRects }) => {
        setRects(nextRects);
      },
    });
  }, [documentId, pageIndex, selectionPlugin]);

  if (!rects.length) return null;

  return (
    <>
      {rects.map((rect, index) => (
        <div
          key={`${index}-${rect.origin.x}-${rect.origin.y}`}
          className="pointer-events-none absolute"
          style={{
            background: TEXT_SELECTION_BACKGROUND,
            height: rect.size.height * scale,
            left: rect.origin.x * scale,
            top: rect.origin.y * scale,
            width: rect.size.width * scale,
          }}
        />
      ))}
    </>
  );
}

function PDFViewerSelectionReleaseGuard({ documentId }: { documentId: string }) {
  const { plugin: selectionPlugin } = useSelectionPlugin();
  const { provides: selection } = useSelectionCapability();
  const lastSelectionModeIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!selection) return;

    return selection.forDocument(documentId).onBeginSelection(({ modeId }) => {
      lastSelectionModeIdRef.current = modeId;
    });
  }, [documentId, selection]);

  React.useEffect(() => {
    if (!selection) return;

    let cleanupFrame = 0;
    const finalizeIfStillSelecting = () => {
      window.cancelAnimationFrame(cleanupFrame);
      cleanupFrame = window.requestAnimationFrame(() => {
        const selectionState = selection.getState(documentId);

        if (!selectionState.selecting) return;

        if (selectionState.selection && selectionPlugin) {
          const pluginWithEndSelection = selectionPlugin as unknown as {
            endSelection?: (documentId: string, modeId: string) => void;
          };

          pluginWithEndSelection.endSelection?.(documentId, lastSelectionModeIdRef.current ?? "pointerMode");
          return;
        }

        if (!selectionState.selection) {
          selection.clear(documentId);
        }
      });
    };

    window.addEventListener("pointerup", finalizeIfStillSelecting);
    window.addEventListener("pointercancel", finalizeIfStillSelecting);
    window.addEventListener("blur", finalizeIfStillSelecting);

    return () => {
      window.cancelAnimationFrame(cleanupFrame);
      window.removeEventListener("pointerup", finalizeIfStillSelecting);
      window.removeEventListener("pointercancel", finalizeIfStillSelecting);
      window.removeEventListener("blur", finalizeIfStillSelecting);
    };
  }, [documentId, selection, selectionPlugin]);

  return null;
}

function isEditableCopyTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  return Boolean(target.closest("input, textarea, [contenteditable='true']"));
}

function PDFViewerSelectionCopyShortcut({ documentId }: { documentId: string }) {
  const { provides: selection } = useSelectionCapability();

  React.useEffect(() => {
    if (!selection) return;

    const copySelectedPdfText = (event: Event) => {
      if (isEditableCopyTarget(event.target)) return;
      if (!selection.getState(documentId).selection) return;

      event.preventDefault();
      selection.copyToClipboard(documentId);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "c") return;
      if (!event.metaKey && !event.ctrlKey) return;

      copySelectedPdfText(event);
    };

    document.addEventListener("copy", copySelectedPdfText);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", copySelectedPdfText);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [documentId, selection]);

  return null;
}

function isQuarterTurn(rotation: Rotation) {
  return rotation % 2 === 1;
}

function getRotatedDimensions({ height, rotation, width }: { height: number; rotation: Rotation; width: number }) {
  return isQuarterTurn(rotation) ? { height: width, width: height } : { height, width };
}

function getRotatedPageDimensions(page: PageLayout, rotation: Rotation) {
  return getRotatedDimensions({
    height: page.height,
    rotation,
    width: page.width,
  });
}

function applyPageRotationDeltasToScrollerLayout({
  basePageRotations,
  layout,
  pageRotationDeltas,
}: {
  basePageRotations: Rotation[];
  layout: ScrollerLayout;
  pageRotationDeltas: PageRotationDeltas;
}): ScrollerLayout {
  if (pageRotationDeltas.size === 0) return layout;

  let maxWidth = 0;
  let maxHeight = 0;
  let offset = 0;
  const pageGap = layout.pageGap;
  let startSpacingAdjustment = 0;
  const items: VirtualItem[] = layout.items.map((item, itemIndex) => {
    let pageOffset = 0;
    let itemWidth = 0;
    let itemHeight = 0;
    const pageLayouts = item.pageLayouts.map((page) => {
      const basePageRotation = basePageRotations[page.pageIndex] ?? normalizeRotation(0);
      const pageRotation = normalizeRotation(basePageRotation + (pageRotationDeltas.get(page.pageIndex) ?? 0));
      const rotatedSize = getRotatedPageDimensions(page, pageRotation);
      const oldScrollAxisSize = layout.strategy === ScrollStrategy.Horizontal ? page.rotatedWidth : page.rotatedHeight;
      const newScrollAxisSize = layout.strategy === ScrollStrategy.Horizontal ? rotatedSize.width : rotatedSize.height;

      if (layout.startSpacing === 0 && itemIndex === 0 && pageOffset === 0 && newScrollAxisSize < oldScrollAxisSize) {
        startSpacingAdjustment = Math.max(startSpacingAdjustment, (oldScrollAxisSize - newScrollAxisSize) / 2);
      }

      const nextPageLayout = {
        ...page,
        rotatedHeight: rotatedSize.height,
        rotatedWidth: rotatedSize.width,
        x: layout.strategy === ScrollStrategy.Horizontal ? 0 : pageOffset,
        y: layout.strategy === ScrollStrategy.Horizontal ? pageOffset : 0,
      };

      pageOffset += (layout.strategy === ScrollStrategy.Horizontal ? rotatedSize.height : rotatedSize.width) + pageGap;
      itemWidth =
        layout.strategy === ScrollStrategy.Horizontal
          ? Math.max(itemWidth, rotatedSize.width)
          : itemWidth + rotatedSize.width;
      itemHeight =
        layout.strategy === ScrollStrategy.Horizontal
          ? itemHeight + rotatedSize.height
          : Math.max(itemHeight, rotatedSize.height);

      return nextPageLayout;
    });

    if (pageLayouts.length > 1) {
      if (layout.strategy === ScrollStrategy.Horizontal) {
        itemHeight -= pageGap;
      } else {
        itemWidth -= pageGap;
      }
    }

    const nextItem = {
      ...item,
      height: itemHeight,
      offset,
      pageLayouts,
      width: itemWidth,
      x: layout.strategy === ScrollStrategy.Horizontal ? offset : item.x,
      y: layout.strategy === ScrollStrategy.Horizontal ? item.y : offset,
    };

    if (layout.strategy === ScrollStrategy.Horizontal) {
      offset += itemWidth + pageGap;
      maxHeight = Math.max(maxHeight, itemHeight);
    } else {
      offset += itemHeight + pageGap;
      maxWidth = Math.max(maxWidth, itemWidth);
    }

    return nextItem;
  });

  if (items.length > 0) {
    offset -= pageGap;
  }

  return {
    ...layout,
    endSpacing: layout.endSpacing,
    items,
    startSpacing: layout.startSpacing + startSpacingAdjustment,
    totalHeight:
      layout.strategy === ScrollStrategy.Horizontal
        ? maxHeight
        : layout.startSpacing + startSpacingAdjustment + offset + layout.endSpacing,
    totalWidth:
      layout.strategy === ScrollStrategy.Horizontal
        ? layout.startSpacing + startSpacingAdjustment + offset + layout.endSpacing
        : maxWidth,
  };
}

function PDFViewerScroller({
  documentId,
  pageRotationDeltas,
  basePageRotations,
  renderPage,
}: {
  documentId: string;
  pageRotationDeltas: PageRotationDeltas;
  basePageRotations: Rotation[];
  renderPage: (props: PageLayout) => React.ReactNode;
}) {
  const { plugin: scrollPlugin } = useScrollPlugin();
  const [layoutData, setLayoutData] = React.useState<{
    docId: string | null;
    layout: ScrollerLayout | null;
  }>({ docId: null, layout: null });

  React.useEffect(() => {
    if (!scrollPlugin || !documentId) return;
    let frame = 0;

    const setCurrentLayout = () => {
      try {
        setLayoutData({
          docId: documentId,
          layout: scrollPlugin.getScrollerLayout(documentId),
        });
      } catch {
        setLayoutData({ docId: documentId, layout: null });
      }
    };

    const unsubscribe = scrollPlugin.onScrollerData(documentId, (layout) => {
      setLayoutData({ docId: documentId, layout });
    });

    frame = window.requestAnimationFrame(setCurrentLayout);

    return () => {
      window.cancelAnimationFrame(frame);
      unsubscribe();
      setLayoutData({ docId: null, layout: null });
      scrollPlugin.clearLayoutReady(documentId);
    };
  }, [documentId, scrollPlugin]);

  const scrollerLayout = React.useMemo(() => {
    if (layoutData.docId !== documentId || !layoutData.layout) return null;

    return applyPageRotationDeltasToScrollerLayout({
      basePageRotations,
      layout: layoutData.layout,
      pageRotationDeltas,
    });
  }, [basePageRotations, documentId, layoutData, pageRotationDeltas]);

  React.useLayoutEffect(() => {
    if (!scrollPlugin || !documentId || !scrollerLayout) return;
    scrollPlugin.setLayoutReady(documentId);
  }, [documentId, scrollPlugin, scrollerLayout]);

  if (!scrollerLayout) return null;

  return (
    <div
      style={{
        width: `${scrollerLayout.totalWidth}px`,
        height: `${scrollerLayout.totalHeight}px`,
        position: "relative",
        boxSizing: "border-box",
        margin: "0 auto",
        ...(scrollerLayout.strategy === ScrollStrategy.Horizontal && {
          display: "flex",
          flexDirection: "row",
        }),
      }}
    >
      <div
        style={
          scrollerLayout.strategy === ScrollStrategy.Horizontal
            ? {
                width: scrollerLayout.startSpacing,
                height: "100%",
                flexShrink: 0,
              }
            : {
                height: scrollerLayout.startSpacing,
                width: "100%",
              }
        }
      />
      <div
        style={{
          gap: scrollerLayout.pageGap,
          display: "flex",
          alignItems: "center",
          position: "relative",
          boxSizing: "border-box",
          ...(scrollerLayout.strategy === ScrollStrategy.Horizontal
            ? {
                flexDirection: "row",
                minHeight: "100%",
              }
            : {
                flexDirection: "column",
                minWidth: "fit-content",
              }),
        }}
      >
        {scrollerLayout.items.map((item) => (
          <div
            key={item.pageNumbers[0]}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: scrollerLayout.pageGap,
            }}
          >
            {item.pageLayouts.map((layout) => (
              <div
                key={layout.pageNumber}
                style={{
                  width: `${layout.rotatedWidth}px`,
                  height: `${layout.rotatedHeight}px`,
                  position: "relative",
                  zIndex: layout.elevated ? 1 : undefined,
                }}
              >
                {renderPage(layout)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        style={
          scrollerLayout.strategy === ScrollStrategy.Horizontal
            ? {
                width: scrollerLayout.endSpacing,
                height: "100%",
                flexShrink: 0,
              }
            : {
                height: scrollerLayout.endSpacing,
                width: "100%",
              }
        }
      />
    </div>
  );
}

type PDFViewerInnerProps = {
  viewerRef: React.ForwardedRef<PDFViewerHandle>;
  pdfFile: string;
  documentId: string;
  document: PdfDocumentObject | null;
  defaultZoom: number;
  className?: string;
  fileName?: string;
  showDownload: boolean;
  showToolbar: boolean;
  showRotateControls: boolean;
  showUpload: boolean;
  toolbarActions?: React.ReactNode;
  pageClassName?: (pageNumber: number) => string | undefined;
  renderPageOverlay?: (props: PDFViewerPageOverlayProps) => React.ReactNode;
  onActivePageChange?: (pageNumber: number) => void;
  onPdfUpload?: (file: File) => void;
  onPagePointerDown?: PDFViewerProps["onPagePointerDown"];
  onPagePointerMove?: PDFViewerProps["onPagePointerMove"];
  onPagePointerUp?: PDFViewerProps["onPagePointerUp"];
  onPagePointerCancel?: PDFViewerProps["onPagePointerCancel"];
  onUploadFile: (file: File) => void;
};

function PDFViewerInner({
  viewerRef,
  pdfFile,
  documentId,
  document: pdfDocument,
  defaultZoom,
  className,
  fileName,
  showDownload,
  showToolbar,
  showRotateControls,
  showUpload,
  toolbarActions,
  pageClassName,
  renderPageOverlay,
  onActivePageChange,
  onPdfUpload,
  onPagePointerDown,
  onPagePointerMove,
  onPagePointerUp,
  onPagePointerCancel,
  onUploadFile,
}: PDFViewerInnerProps) {
  const { registry } = useRegistry();
  const { state: scrollState, provides: scroll } = useScroll(documentId);
  const { state: zoomState, provides: zoom } = useZoom(documentId);
  const { provides: thumbnails } = useThumbnailCapability();
  const { plugin: thumbnailPlugin } = useThumbnailPlugin();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = React.useState(false);
  const [pageRotationDeltas, setPageRotationDeltas] = React.useState<PageRotationDeltas>(() => new Map());
  const [selectedPageIndexes, setSelectedPageIndexes] = React.useState<Set<number>>(() => new Set());
  const basePageRotations = React.useMemo(
    () => pdfDocument?.pages.map((page) => normalizeRotation(page.rotation)) ?? [],
    [pdfDocument]
  );
  const [viewerShellRef, viewerShellWidth] = useElementWidth<HTMLDivElement>();
  const sidebarInline = useInlineThumbnailSidebar(viewerShellWidth);
  const viewportElementRef = React.useRef<HTMLDivElement | null>(null);
  const pageRotationDeltasRef = React.useRef(pageRotationDeltas);
  const selectedPageIndexesRef = React.useRef(selectedPageIndexes);
  const selectionAnchorPageIndexRef = React.useRef<number | null>(null);
  const suppressActivePageSelectionSyncRef = React.useRef<number | null>(null);
  const initializedSelectionDocumentRef = React.useRef<string | null>(null);

  const activePage = scrollState.currentPage;
  const numPages = pdfDocument?.pageCount ?? 0;
  const isLoading = !pdfDocument;
  const controlsDisabled = !numPages;
  const downloadDisabled = controlsDisabled || isPreparingDownload;
  const thumbnailSidebarVisible = sidebarOpen && !isLoading;
  const currentZoomLevel = zoomState.currentZoomLevel;
  const alignedThumbnailSidebarDocumentRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    pageRotationDeltasRef.current = pageRotationDeltas;
  }, [pageRotationDeltas]);

  React.useEffect(() => {
    selectedPageIndexesRef.current = selectedPageIndexes;
  }, [selectedPageIndexes]);

  React.useEffect(() => {
    if (activePage > 0) onActivePageChange?.(activePage);
  }, [activePage, onActivePageChange]);

  React.useEffect(() => {
    if (activePage < 1 || numPages < 1) return;

    const activePageIndex = activePage - 1;
    const suppressedPageIndex = suppressActivePageSelectionSyncRef.current;

    suppressActivePageSelectionSyncRef.current = null;

    if (suppressedPageIndex === activePageIndex) return;

    const nextSelection = new Set([activePageIndex]);

    selectionAnchorPageIndexRef.current = activePageIndex;
    selectedPageIndexesRef.current = nextSelection;
    setSelectedPageIndexes((previousSelection) =>
      arePageIndexSetsEqual(previousSelection, nextSelection) ? previousSelection : nextSelection
    );
  }, [activePage, numPages]);

  React.useEffect(() => {
    if (numPages < 1 || initializedSelectionDocumentRef.current === documentId) {
      return;
    }

    const initialPageIndex = Math.max(0, (activePage > 0 ? activePage : 1) - 1);
    const initialSelection = new Set([initialPageIndex]);

    initializedSelectionDocumentRef.current = documentId;
    selectionAnchorPageIndexRef.current = initialPageIndex;
    selectedPageIndexesRef.current = initialSelection;
    setSelectedPageIndexes(initialSelection);
  }, [activePage, documentId, numPages]);

  React.useEffect(() => {
    if (!thumbnailSidebarVisible) {
      alignedThumbnailSidebarDocumentRef.current = null;
      return;
    }

    if (activePage < 1 || !thumbnails || alignedThumbnailSidebarDocumentRef.current === documentId) {
      return;
    }

    alignedThumbnailSidebarDocumentRef.current = documentId;
    const frame = window.requestAnimationFrame(() => {
      thumbnails.forDocument(documentId).scrollToThumb(activePage - 1);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activePage, documentId, thumbnailSidebarVisible, thumbnails]);

  // The zoom plugin only releases its viewport gate for mode-based zoom
  // levels (automatic/fit); with a numeric default the gate would never
  // lift, so apply the initial zoom explicitly once the document loads.
  const initialZoomDocumentRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!pdfDocument || !zoom) return;
    if (initialZoomDocumentRef.current === documentId) return;

    initialZoomDocumentRef.current = documentId;
    zoom.requestZoom(defaultZoom);
  }, [defaultZoom, documentId, pdfDocument, zoom]);

  const scrollToPage = React.useCallback(
    (pageNumber: number, options?: ScrollIntoViewOptions) => {
      scroll?.scrollToPage({
        pageNumber,
        behavior: options?.behavior === "smooth" ? "smooth" : "auto",
      });
    },
    [scroll]
  );

  const selectThumbnailPage = React.useCallback(
    (pageNumber: number, mode: ThumbnailSelectionMode) => {
      const pageIndex = pageNumber - 1;

      if (pageIndex < 0 || pageIndex >= numPages) return;

      suppressActivePageSelectionSyncRef.current = pageIndex;

      setSelectedPageIndexes((previousSelection) => {
        let nextSelection: Set<number>;

        if (mode === "range") {
          const anchorPageIndex = selectionAnchorPageIndexRef.current ?? (activePage > 0 ? activePage - 1 : pageIndex);

          nextSelection = getPageIndexRange(anchorPageIndex, pageIndex);
        } else if (mode === "toggle") {
          nextSelection = new Set(previousSelection);

          if (nextSelection.has(pageIndex)) {
            nextSelection.delete(pageIndex);
          } else {
            nextSelection.add(pageIndex);
          }

          selectionAnchorPageIndexRef.current = pageIndex;
        } else {
          nextSelection = new Set([pageIndex]);
          selectionAnchorPageIndexRef.current = pageIndex;
        }

        selectedPageIndexesRef.current = nextSelection;
        return nextSelection;
      });

      scrollToPage(pageNumber);
    },
    [activePage, numPages, scrollToPage]
  );

  React.useImperativeHandle(
    viewerRef,
    () => ({
      scrollToPage,
      scrollToPageArea: (pageNumber, area, options) => {
        const pageSize = pdfDocument?.pages[pageNumber - 1]?.size;

        scroll?.scrollToPage({
          pageNumber,
          ...(pageSize
            ? {
                pageCoordinates: {
                  x: ((area.left ?? 0) / 100) * pageSize.width,
                  y: (area.top / 100) * pageSize.height,
                },
                alignY: 25,
              }
            : {}),
          behavior: options?.behavior === "smooth" ? "smooth" : "auto",
        });
      },
      getViewportElement: () => viewportElementRef.current,
    }),
    [pdfDocument, scroll, scrollToPage]
  );

  const handleDownload = React.useCallback(async () => {
    if (!pdfFile || isPreparingDownload) return;

    setIsPreparingDownload(true);

    try {
      await downloadPdfWithPageRotations({
        fileName: getPdfDownloadFileName(fileName, pdfFile),
        pageRotationDeltas,
        src: pdfFile,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsPreparingDownload(false);
    }
  }, [fileName, isPreparingDownload, pageRotationDeltas, pdfFile]);

  const rotateSelectedPages = React.useCallback(
    (direction: -1 | 1) => {
      if (!pdfDocument || !registry || activePage < 1) return;

      const documentState = registry.getStore().getState().core.documents[documentId];
      const currentDocument = documentState?.document ?? pdfDocument;
      const selectedTargetPageIndexes = Array.from(selectedPageIndexesRef.current).filter(
        (pageIndex) => currentDocument.pages[pageIndex]
      );
      const fallbackPageIndex = activePage - 1;
      const targetPageIndexes = (selectedTargetPageIndexes.length ? selectedTargetPageIndexes : [fallbackPageIndex])
        .filter((pageIndex) => currentDocument.pages[pageIndex])
        .sort((a, b) => a - b);

      if (targetPageIndexes.length === 0) return;

      const previousDeltas = pageRotationDeltasRef.current;
      const nextDeltas = new Map(previousDeltas);
      const referencePageIndex =
        activePage > 0 && currentDocument.pages[activePage - 1] ? activePage - 1 : targetPageIndexes[0];
      let scrollDelta = 0;

      for (const pageIndex of targetPageIndexes) {
        const currentPage = currentDocument.pages[pageIndex];
        if (!currentPage) continue;

        const previousDelta = previousDeltas.get(pageIndex) ?? 0;
        const nextDelta = normalizeRotation(previousDelta + direction);
        const basePageRotation = basePageRotations[pageIndex] ?? normalizeRotation(currentPage.rotation);
        const previousPageRotation = normalizeRotation(basePageRotation + previousDelta);
        const nextPageRotation = normalizeRotation(basePageRotation + nextDelta);
        const previousRotatedSize = getRotatedDimensions({
          height: currentPage.size.height * currentZoomLevel,
          rotation: previousPageRotation,
          width: currentPage.size.width * currentZoomLevel,
        });
        const nextRotatedSize = getRotatedDimensions({
          height: currentPage.size.height * currentZoomLevel,
          rotation: nextPageRotation,
          width: currentPage.size.width * currentZoomLevel,
        });
        const heightDelta = nextRotatedSize.height - previousRotatedSize.height;

        if (pageIndex < referencePageIndex) {
          scrollDelta += heightDelta;
        } else if (pageIndex === referencePageIndex) {
          scrollDelta += heightDelta / 2;
        }

        if (nextDelta) {
          nextDeltas.set(pageIndex, nextDelta);
        } else {
          nextDeltas.delete(pageIndex);
        }
      }

      const store = registry.getStore();
      const viewport = viewportElementRef.current;

      pageRotationDeltasRef.current = nextDeltas;
      flushSync(() => {
        setPageRotationDeltas(nextDeltas);
        store.dispatchToCore(refreshPages(documentId, targetPageIndexes));
      });

      if (viewport && scrollDelta !== 0) {
        viewport.scrollTop += scrollDelta;
      }
      (
        thumbnailPlugin as unknown as {
          calculateWindowState?: (documentId: string) => void;
        } | null
      )?.calculateWindowState?.(documentId);
    },
    [activePage, basePageRotations, currentZoomLevel, documentId, pdfDocument, registry, thumbnailPlugin]
  );

  const handleUpload = React.useCallback(
    (file: File) => {
      onUploadFile(file);
      onPdfUpload?.(file);
    },
    [onPdfUpload, onUploadFile]
  );

  const renderPage = React.useCallback(
    (page: PageLayout) => {
      const pageNumber = page.pageNumber;
      const basePageRotation =
        basePageRotations[page.pageIndex] ?? pdfDocument?.pages[page.pageIndex]?.rotation ?? normalizeRotation(0);
      const pageRotation = normalizeRotation(basePageRotation + (pageRotationDeltas.get(page.pageIndex) ?? 0));

      return (
        <Rotate documentId={documentId} pageIndex={page.pageIndex} rotation={pageRotation}>
          <PagePointerProvider
            documentId={documentId}
            pageIndex={page.pageIndex}
            rotation={pageRotation}
            key={`${page.pageIndex}-${pageRotation}`}
            data-pdf-viewer-page={pageNumber}
            className={cn(
              "shadow-xs relative border border-transparent bg-transparent select-none selection:bg-transparent selection:text-inherit",
              pageClassName?.(pageNumber)
            )}
            style={{ backgroundColor: "transparent" }}
            onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => onPagePointerDown?.(event, pageNumber)}
            onPointerMove={(event: React.PointerEvent<HTMLDivElement>) => onPagePointerMove?.(event, pageNumber)}
            onPointerUp={(event: React.PointerEvent<HTMLDivElement>) => onPagePointerUp?.(event, pageNumber)}
            onPointerCancel={(event: React.PointerEvent<HTMLDivElement>) => onPagePointerCancel?.(event, pageNumber)}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white" />
            <RenderLayer
              documentId={documentId}
              pageIndex={page.pageIndex}
              scale={Math.min(currentZoomLevel, PAGE_BASE_RENDER_MAX_SCALE)}
              dpr={PAGE_BASE_RENDER_DPR}
              className="pointer-events-none absolute inset-0 h-full w-full object-fill opacity-100 blur-[0.35px] transition-none"
            />
            <TilingLayer
              documentId={documentId}
              pageIndex={page.pageIndex}
              key={`tiles-${page.pageIndex}-${pageRotation}`}
              className="pointer-events-none opacity-100 transition-none [&_img]:opacity-100 [&_img]:transition-none"
            />
            <SearchLayer
              documentId={documentId}
              pageIndex={page.pageIndex}
              className="pointer-events-none"
              highlightColor="rgba(253, 224, 71, 0.45)"
              activeHighlightColor="rgba(249, 115, 22, 0.55)"
            />
            <PDFViewerTextSelectionLayer documentId={documentId} pageIndex={page.pageIndex} scale={currentZoomLevel} />
            {renderPageOverlay?.({
              pageNumber,
              pageWidth: page.width,
              pageHeight: page.height,
              scale: currentZoomLevel,
              rotation: rotationToDegrees(pageRotation),
            })}
          </PagePointerProvider>
        </Rotate>
      );
    },
    [
      basePageRotations,
      currentZoomLevel,
      onPagePointerCancel,
      onPagePointerDown,
      onPagePointerMove,
      onPagePointerUp,
      pageClassName,
      pageRotationDeltas,
      renderPageOverlay,
      documentId,
      pdfDocument,
    ]
  );

  return (
    <div
      data-slot="pdf-viewer"
      className={cn("bg-background flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden", className)}
    >
      {showToolbar ? (
        <div className="bg-background flex min-h-12 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <TooltipProvider>
              <ToolbarTooltip label="Toggle thumbnails">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Toggle thumbnails"
                  disabled={controlsDisabled}
                  onClick={() => setSidebarOpen((open) => !open)}
                >
                  <HugeiconsIcon icon={SidebarLeftIcon} className="size-4" />
                </Button>
              </ToolbarTooltip>
            </TooltipProvider>
            <PDFViewerPageNumberControl
              activePage={activePage}
              controlsDisabled={controlsDisabled}
              numPages={numPages}
              onPageChange={scrollToPage}
            />
          </div>
          <TooltipProvider>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1">
              {showRotateControls ? (
                <>
                  <div className="flex flex-none items-center gap-1">
                    <ToolbarTooltip label="Rotate counterclockwise">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Rotate counterclockwise"
                        disabled={controlsDisabled}
                        onClick={() => rotateSelectedPages(-1)}
                      >
                        <HugeiconsIcon icon={RotateClockwiseIcon} className="size-4" />
                      </Button>
                    </ToolbarTooltip>
                    <ToolbarTooltip label="Rotate clockwise">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Rotate clockwise"
                        disabled={controlsDisabled}
                        onClick={() => rotateSelectedPages(1)}
                      >
                        <HugeiconsIcon icon={RotateClockwiseIcon} className="size-4 -scale-x-100" />
                      </Button>
                    </ToolbarTooltip>
                  </div>
                  <Separator orientation="vertical" className="mx-1 h-4 self-center" />
                </>
              ) : null}
              <div className="flex flex-none items-center gap-1">
                <ToolbarTooltip label="Zoom out">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom out"
                    disabled={controlsDisabled || currentZoomLevel <= ZOOM_OPTIONS[0]}
                    onClick={() => {
                      const nextZoom = [...ZOOM_OPTIONS].reverse().find((option) => option < currentZoomLevel);

                      zoom?.requestZoom(nextZoom ?? ZOOM_OPTIONS[0]);
                    }}
                  >
                    <HugeiconsIcon icon={MinusSignCircleIcon} className="size-4" />
                  </Button>
                </ToolbarTooltip>
                <Select
                  value={String(currentZoomLevel)}
                  onValueChange={(value) => zoom?.requestZoom(Number(value))}
                  disabled={controlsDisabled}
                  modal={false}
                >
                  <SelectTrigger size="sm" className="w-[84px] min-w-[84px]">
                    <SelectValue placeholder="Zoom">{Math.round(currentZoomLevel * 100)}%</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {ZOOM_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {Math.round(option * 100)}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ToolbarTooltip label="Zoom in">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Zoom in"
                    disabled={controlsDisabled || currentZoomLevel >= ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1]}
                    onClick={() => {
                      const nextZoom = ZOOM_OPTIONS.find((option) => option > currentZoomLevel);

                      zoom?.requestZoom(nextZoom ?? ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1]);
                    }}
                  >
                    <HugeiconsIcon icon={PlusSignCircleIcon} className="size-4" />
                  </Button>
                </ToolbarTooltip>
              </div>
              <Separator orientation="vertical" className="mx-1 h-4 self-center" />
              <PDFViewerSearchControl key={documentId} documentId={documentId} controlsDisabled={controlsDisabled} />
              {toolbarActions ? (
                <>
                  <Separator orientation="vertical" className="mx-1 h-4 self-center" />
                  {toolbarActions}
                </>
              ) : null}
              {showDownload || showUpload ? (
                <>
                  <Separator orientation="vertical" className="mx-1 h-4 self-center" />
                  <PDFViewerFileActionsMenu
                    downloadDisabled={downloadDisabled}
                    isPreparingDownload={isPreparingDownload}
                    onDownload={handleDownload}
                    onUploadFile={handleUpload}
                    showDownload={showDownload}
                    showUpload={showUpload}
                  />
                </>
              ) : null}
            </div>
          </TooltipProvider>
        </div>
      ) : null}
      <div ref={viewerShellRef} className="bg-muted/30 relative flex min-h-0 flex-1 overflow-hidden">
        {isLoading ? <PDFViewerLoadingSkeleton sidebarInline={sidebarInline} sidebarOpen={sidebarOpen} /> : null}
        <div className="flex h-full max-h-full min-h-0 w-full flex-1 overflow-hidden">
          <DocumentViewerThumbnailSidebar
            closedInlineClassName={THUMBNAIL_SIDEBAR_CLOSED_CLASS}
            inline={sidebarInline}
            open={thumbnailSidebarVisible}
            widthClassName={THUMBNAIL_SIDEBAR_WIDTH_CLASS}
          >
            {thumbnailSidebarVisible ? (
              <PDFViewerThumbnails
                basePageRotations={basePageRotations}
                documentId={documentId}
                activePage={activePage}
                pageCount={numPages}
                pageRotationDeltas={pageRotationDeltas}
                pdfDocument={pdfDocument}
                selectedPageIndexes={selectedPageIndexes}
                onSelectPage={selectThumbnailPage}
              />
            ) : null}
          </DocumentViewerThumbnailSidebar>
          <PDFViewerScrollAreaViewport
            documentId={documentId}
            className="relative h-full max-h-full min-h-0 min-w-0 flex-1"
          >
            <PDFViewerViewportBridge viewportElementRef={viewportElementRef} />
            <PDFViewerSelectionCopyShortcut documentId={documentId} />
            <PDFViewerSelectionReleaseGuard documentId={documentId} />
            <GlobalPointerProvider documentId={documentId}>
              <PDFViewerScroller
                basePageRotations={basePageRotations}
                documentId={documentId}
                pageRotationDeltas={pageRotationDeltas}
                renderPage={renderPage}
              />
            </GlobalPointerProvider>
            <CopyToClipboard />
          </PDFViewerScrollAreaViewport>
        </div>
      </div>
    </div>
  );
}

function PDFViewerDocumentLoader({
  pdfFile,
  onDocumentLoadSuccess,
  ...innerProps
}: {
  pdfFile: string;
  onDocumentLoadSuccess?: (numPages: number) => void;
} & Omit<PDFViewerInnerProps, "pdfFile" | "documentId" | "document">) {
  const { provides: documentManager } = useDocumentManagerCapability();
  const { activeDocumentId, activeDocument } = useActiveDocument();
  const [loadError, setLoadError] = React.useState(false);
  const openedFileRef = React.useRef<string | null>(null);
  const onDocumentLoadSuccessRef = React.useRef(onDocumentLoadSuccess);

  React.useEffect(() => {
    onDocumentLoadSuccessRef.current = onDocumentLoadSuccess;
  });

  React.useEffect(() => {
    if (!documentManager || !pdfFile) return;
    if (openedFileRef.current === pdfFile) return;

    openedFileRef.current = pdfFile;
    setLoadError(false);

    const previousDocumentIds = documentManager.getOpenDocuments().map((openDocument) => openDocument.id);
    const handleOpenError = () => {
      if (openedFileRef.current === pdfFile) setLoadError(true);
    };

    documentManager
      .openDocumentUrl({
        url: pdfFile,
        mode: pdfFile.startsWith("blob:") ? "full-fetch" : "auto",
      })
      .wait((response) => {
        response.task.wait((openedDocument) => {
          onDocumentLoadSuccessRef.current?.(openedDocument.pageCount);
          previousDocumentIds.forEach((documentIdToClose) => {
            documentManager.closeDocument(documentIdToClose).wait(
              () => undefined,
              () => undefined
            );
          });
        }, handleOpenError);
      }, handleOpenError);
  }, [documentManager, pdfFile]);

  const document = activeDocument?.status === "loaded" ? activeDocument.document : null;
  const documentFailed = loadError || activeDocument?.status === "error";

  if (!activeDocumentId || documentFailed || !pdfFile) {
    return (
      <PDFViewerFallbackShell
        className={innerProps.className}
        showToolbar={innerProps.showToolbar}
        showUpload={innerProps.showUpload}
        sidebarOpen={false}
        state={!pdfFile ? "empty" : documentFailed ? "error" : "loading"}
        onUploadFile={(file) => {
          innerProps.onUploadFile(file);
          innerProps.onPdfUpload?.(file);
        }}
      />
    );
  }

  return (
    <PDFViewerInner
      key={activeDocumentId}
      {...innerProps}
      pdfFile={pdfFile}
      documentId={activeDocumentId}
      document={document}
    />
  );
}

export const PDFViewer = React.forwardRef<PDFViewerHandle, PDFViewerProps>(function PDFViewer(
  {
    className,
    defaultZoom = DEFAULT_ZOOM,
    fileName,
    showDownload = true,
    showRotateControls = true,
    showToolbar = true,
    showUpload = true,
    src,
    toolbarActions,
    pageClassName,
    renderPageOverlay,
    onActivePageChange,
    onDocumentLoadSuccess,
    onPdfUpload,
    onPagePointerDown,
    onPagePointerMove,
    onPagePointerUp,
    onPagePointerCancel,
  },
  ref
) {
  const { engine, error: engineError } = useSharedPdfEngine();
  const [uploadedPdfFile, setUploadedPdfFile] = React.useState<{
    src: string | undefined;
    url: string | null;
  }>(() => ({ src, url: null }));
  const uploadedPdfUrl = uploadedPdfFile.src === src ? uploadedPdfFile.url : null;
  const pdfFile = uploadedPdfUrl ?? src ?? "";

  React.useEffect(
    () => () => {
      if (uploadedPdfUrl) URL.revokeObjectURL(uploadedPdfUrl);
    },
    [uploadedPdfUrl]
  );

  const handleUploadFile = React.useCallback(
    (nextFile: File) => {
      const nextUrl = URL.createObjectURL(nextFile);

      setUploadedPdfFile({ src, url: nextUrl });
    },
    [src]
  );

  // Plugin registrations are created once per viewer instance.
  const [plugins] = React.useState(() => [
    createPluginRegistration(DocumentManagerPluginPackage),
    createPluginRegistration(ViewportPluginPackage, {
      viewportGap: PAGE_GAP,
    }),
    createPluginRegistration(ScrollPluginPackage, {
      defaultPageGap: PAGE_GAP,
      defaultBufferSize: 2,
    }),
    createPluginRegistration(RenderPluginPackage),
    createPluginRegistration(TilingPluginPackage, {
      tileSize: 768,
      overlapPx: 2.5,
      extraRings: 0,
    }),
    createPluginRegistration(InteractionManagerPluginPackage),
    createPluginRegistration(SelectionPluginPackage, {
      marquee: { enabled: false },
    }),
    createPluginRegistration(SearchPluginPackage, {
      showAllResults: true,
    }),
    createPluginRegistration(ThumbnailPluginPackage, {
      width: THUMBNAIL_WIDTH,
      gap: THUMBNAIL_GAP,
      imagePadding: THUMBNAIL_IMAGE_PADDING,
      labelHeight: THUMBNAIL_LABEL_HEIGHT,
      paddingY: THUMBNAIL_PANE_PADDING_Y,
      buffer: 3,
      autoScroll: true,
      scrollBehavior: "auto",
    }),
    createPluginRegistration(ZoomPluginPackage, {
      defaultZoomLevel: defaultZoom,
      minZoom: ZOOM_OPTIONS[0],
      maxZoom: ZOOM_OPTIONS[ZOOM_OPTIONS.length - 1],
    }),
    createPluginRegistration(RotatePluginPackage),
  ]);

  if (engineError) {
    return (
      <div
        data-slot="pdf-viewer"
        className={cn(
          "bg-background text-sm text-muted-foreground grid h-full w-full place-items-center p-6",
          className
        )}
      >
        Unable to load the PDF engine.
      </div>
    );
  }

  if (!engine) {
    return (
      <div
        data-slot="pdf-viewer"
        className={cn(
          "bg-background relative flex h-full max-h-full min-h-0 w-full flex-col overflow-hidden",
          className
        )}
      >
        {showToolbar ? <div className="bg-background min-h-12 border-b" /> : null}
        <div className="relative min-h-0 flex-1">
          <PDFViewerLoadingSkeleton sidebarInline sidebarOpen={false} />
        </div>
      </div>
    );
  }

  return (
    <EmbedPDF engine={engine} plugins={plugins}>
      <PDFViewerDocumentLoader
        viewerRef={ref}
        pdfFile={pdfFile}
        defaultZoom={defaultZoom}
        className={className}
        fileName={fileName}
        showDownload={showDownload}
        showToolbar={showToolbar}
        showRotateControls={showRotateControls}
        showUpload={showUpload}
        toolbarActions={toolbarActions}
        pageClassName={pageClassName}
        renderPageOverlay={renderPageOverlay}
        onActivePageChange={onActivePageChange}
        onDocumentLoadSuccess={onDocumentLoadSuccess}
        onPdfUpload={onPdfUpload}
        onPagePointerDown={onPagePointerDown}
        onPagePointerMove={onPagePointerMove}
        onPagePointerUp={onPagePointerUp}
        onPagePointerCancel={onPagePointerCancel}
        onUploadFile={handleUploadFile}
      />
    </EmbedPDF>
  );
});
