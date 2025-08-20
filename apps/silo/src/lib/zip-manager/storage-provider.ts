import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

export interface StorageProvider {
  getContentLength(fileId: string): Promise<number>;
  readRange(fileId: string, start: number, end?: number): Promise<Buffer>;
  exists(fileId: string): Promise<boolean>;
}

export class S3StorageProvider implements StorageProvider {
  private s3Client: S3Client;
  private bucket: string;

  constructor(s3Client: S3Client, bucket: string) {
    this.s3Client = s3Client;
    this.bucket = bucket;
  }

  async getContentLength(fileId: string): Promise<number> {
    const headResponse = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
      })
    );

    if (headResponse.ContentLength === undefined) {
      throw new Error(`Unable to determine content length for ${fileId}`);
    }
    return headResponse.ContentLength;
  }

  async readRange(fileId: string, start: number, end?: number): Promise<Buffer> {
    const range = end !== undefined ? `bytes=${start}-${end}` : `bytes=${start}-`;

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileId,
        Range: range,
      })
    );

    if (!response.Body) {
      throw new Error("Empty response body");
    }

    return Buffer.from(await response.Body.transformToByteArray());
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: fileId,
        })
      );
      return true;
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }
}
