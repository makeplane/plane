declare module "file-type/browser" {
  export interface FileTypeResult {
    ext: string;
    mime: string;
  }
  export function fileTypeFromBuffer(buffer: Uint8Array): Promise<FileTypeResult | undefined>;
}
