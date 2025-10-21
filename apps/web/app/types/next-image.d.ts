declare module "next/image" {
  const Image: typeof import("../compat/next/image").default;
  export default Image;

  // Export StaticImageData type for compatibility
  export interface StaticImageData {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  }
}
