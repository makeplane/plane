import React from "react";
import Image from "next/image";
// image
import CSVFileIcon from "public/attachment/csv-icon.png";
// type
import type { ImageIconPros } from "./types";

export const CsvIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={CSVFileIcon} height={height} width={width} alt="CSVFileIcon" />
);
