import React from "react";
import Image from "next/image";
// image
import JsFileIcon from "@/app/assets/attachment/js-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const JavaScriptIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={JsFileIcon} height={height} width={width} alt="JsFileIcon" />
);
