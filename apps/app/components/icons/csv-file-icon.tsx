import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import CSVFileIcon from "public/attachment/csv-icon.png";

export const CsvIcon: React.FC<Props> = ({ width , height }) => (
  <Image src={CSVFileIcon} height={height} width={width} alt="CSVFileIcon" />
);
