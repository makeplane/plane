import React from "react";
// image
import JsFileIcon from "@/app/assets/attachment/js-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function JavaScriptIcon({ width, height }: ImageIconPros) {
  return <img src={JsFileIcon} width={width} height={height} alt="JsFileIcon" />;
}
