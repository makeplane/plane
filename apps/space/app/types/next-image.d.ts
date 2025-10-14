declare module "next/image" {
  import type { FC, ImgHTMLAttributes } from "react";

  type NextImageProps = ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
  };

  const Image: FC<NextImageProps>;
  export default Image;
}
