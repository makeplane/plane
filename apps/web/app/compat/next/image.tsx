import React from "react";

// Minimal shim so code using next/image compiles under React Router + Vite
// without changing call sites. It just renders a native img.

type NextImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
};

function Image({
  src,
  alt = "",
  fill,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  ...rest
}: NextImageProps) {
  // If fill is true, apply object-fit styles
  const style = fill ? { objectFit: "cover" as const, width: "100%", height: "100%" } : rest.style;

  return <img src={src} alt={alt} {...rest} style={style} />;
}

export default Image;
