import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import CSVIcon from "public/attachment/csv-icon.png";

export const CsvIcon: React.FC<Props> = ({ width , height }) => (
  <Image src={CSVIcon} height={height} width={width} alt="CSVIcon" />
);
