import React from "react";
// image
import JsFileIcon from "@/app/assets/attachment/js-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const JavaScriptIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={JsFileIcon} width={width} height={height} alt="JsFileIcon" />
);
