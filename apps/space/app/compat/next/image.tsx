"use client";

import React from "react";

// Minimal shim so code using next/image compiles under React Router + Vite
// without changing call sites. It just renders a native img.

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
};

const Image: React.FC<NextImageProps> = ({ src, alt = "", ...rest }) => <img src={src} alt={alt} {...rest} />;

export default Image;
