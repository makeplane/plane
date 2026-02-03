"use client";

import type { TMediaItem } from "../types";

export const useVideoDuration = (item: TMediaItem) => (item.duration ? item.duration : "-");
