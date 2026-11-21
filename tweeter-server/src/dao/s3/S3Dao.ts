// Partially written by AI.

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Buffer } from "buffer";
import type { ImageDao, ImageData } from "../ImageDao";

const BUCKET_NAME = "tweeter-user-images-727728513382";
const REGION = "us-east-2";

const contentTypesByExtension: Readonly<Record<string, string>> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class S3Dao implements ImageDao {
  private readonly client = new S3Client({ region: REGION });

  public async putItem(image: ImageData): Promise<void> {
    const { fileName, imageBytes } = image;
    const imageBuffer = Buffer.from(imageBytes);
    if (imageBuffer.byteLength === 0) {
      throw new Error("Cannot upload an empty image");
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: this.getImageKey(fileName),
      Body: imageBuffer,
      ContentType: this.getContentType(fileName),
      ACL: ObjectCannedACL.public_read,
    });

    try {
      await this.client.send(command);
    } catch (error) {
      throw new Error(`s3 put image failed with: ${String(error)}`);
    }
  }

  public async getItem(fileName: string): Promise<ImageData | undefined> {
    try {
      const output = await this.client.send(
        new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: this.getImageKey(fileName),
        }),
      );
      if (output.Body === undefined) {
        throw new Error(`S3 image '${fileName}' had no body`);
      }

      return {
        fileName,
        imageBytes: await output.Body.transformToByteArray(),
      };
    } catch (error) {
      if (this.isNotFound(error)) {
        return undefined;
      }
      throw new Error(`s3 get image failed with: ${String(error)}`);
    }
  }

  public async deleteItem(fileName: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: this.getImageKey(fileName),
        }),
      );
    } catch (error) {
      throw new Error(`s3 delete image failed with: ${String(error)}`);
    }
  }

  public getImageUrl(fileName: string): string {
    const encodedKey = this.getImageKey(fileName)
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${encodedKey}`;
  }

  private getImageKey(fileName: string): string {
    return `image/${fileName}`;
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const contentType = contentTypesByExtension[extension];
    if (contentType === undefined) {
      throw new Error(`Unsupported image file extension '${extension}'`);
    }
    return contentType;
  }

  private isNotFound(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
      return false;
    }

    const s3Error = error as {
      name?: unknown;
      $metadata?: { httpStatusCode?: unknown };
    };
    return (
      s3Error.name === "NoSuchKey" ||
      s3Error.name === "NotFound" ||
      s3Error.$metadata?.httpStatusCode === 404
    );
  }
}
