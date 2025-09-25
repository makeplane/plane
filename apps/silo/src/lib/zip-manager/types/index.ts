import { S3Client } from "@aws-sdk/client-s3";

export type TZipFileNode = {
  id: string;
  name: string;
  type: EZipNodeType;
  path: string;
  depth: number;
  children?: TZipFileNode[];
};

export type TZipManagerOptions = {
  type: "local" | "s3";
  path?: string;
  bucket?: string;
  s3Client?: S3Client;
};

export enum EZipNodeType {
  FILE = "file",
  DIRECTORY = "directory",
}
