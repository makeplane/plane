import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import JsFileIcon from "public/attachment/js-icon.png";

export const JavaScriptIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={JsFileIcon} height={height} width={width} alt="JsFileIcon" />
);
