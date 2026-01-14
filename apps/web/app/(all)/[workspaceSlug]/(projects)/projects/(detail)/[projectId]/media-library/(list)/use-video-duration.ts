"use client";

import type { TMediaItem } from "./media-items";

export const useVideoDuration = (item: TMediaItem) => (item.duration ? item.duration : "-");
