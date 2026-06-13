"use client";

import type { TMediaItem } from "../types/media-library.types";

export const useVideoDuration = (item: TMediaItem) => (item.duration ? item.duration : "-");
