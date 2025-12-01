import React from "react";
// image
import CSVFileIcon from "@/app/assets/attachment/csv-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function CsvIcon({ width, height }: ImageIconPros) {
  return <img src={CSVFileIcon} width={width} height={height} alt="CSVFileIcon" />;
}
