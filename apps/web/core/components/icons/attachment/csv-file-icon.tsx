import React from "react";
import Image from "next/image";
// image
import CSVFileIcon from "@/app/assets/attachment/csv-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const CsvIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={CSVFileIcon} height={height} width={width} alt="CSVFileIcon" />
);
