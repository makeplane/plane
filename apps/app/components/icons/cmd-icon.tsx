import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import CMDIcon from "public/mac-command.svg";

export const MacCommandIcon: React.FC<Props> = ({ width = "14", height = "14" }) => (
  <Image src={CMDIcon} height={height} width={width} alt="CMDIcon" />
);

export default MacCommandIcon;
