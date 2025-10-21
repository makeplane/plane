"use client";

import React from "react";
import type { StaticImageData } from "next/image";

type NextImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | StaticImageData;
  // Next.js specific props that we ignore in the shim
  layout?: "fill" | "fixed" | "responsive" | "intrinsic";
  objectFit?: string;
  lazyBoundary?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
};

const Image: React.FC<NextImageProps> = ({
  src,
  alt = "",
  layout,
  objectFit,
  lazyBoundary,
  priority,
  quality,
  placeholder,
  blurDataURL,
  ...rest
}) => {
  // Handle StaticImageData object (from Next.js image imports)
  const imgSrc = typeof src === "string" ? src : (src as StaticImageData).src;
  return <img src={imgSrc} alt={alt} {...rest} />;
};

export default Image;
