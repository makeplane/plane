import React from "react";
// image
import CSVFileIcon from "@/app/assets/attachment/csv-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const CsvIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={CSVFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="CSVFileIcon" />
);
