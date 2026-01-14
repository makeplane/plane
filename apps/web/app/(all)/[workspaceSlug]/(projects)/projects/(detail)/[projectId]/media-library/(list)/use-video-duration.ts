"use client";

import type { TMediaItem } from "./media-items";

export const useVideoDuration = (item: TMediaItem) => (item.mediaType === "video" ? item.duration : "-");
