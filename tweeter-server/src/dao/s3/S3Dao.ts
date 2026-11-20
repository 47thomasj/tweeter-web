// Partially written by AI.

import {
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Buffer } from "buffer";

const BUCKET_NAME = "tweeter-user-images-727728513382";
const REGION = "us-east-2";

const contentTypesByExtension: Readonly<Record<string, string>> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class S3Dao {
  private readonly client = new S3Client({ region: REGION });

  public async putImage(
    fileName: string,
    imageBytes: Uint8Array,
  ): Promise<string> {
    const imageBuffer = Buffer.from(imageBytes);
    if (imageBuffer.byteLength === 0) {
      throw new Error("Cannot upload an empty image");
    }

    const key = `image/${fileName}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: this.getContentType(fileName),
      ACL: ObjectCannedACL.public_read,
    });

    try {
      await this.client.send(command);
      const encodedKey = key
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
      return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${encodedKey}`;
    } catch (error) {
      throw new Error(`s3 put image failed with: ${String(error)}`);
    }
  }

  private getContentType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const contentType = contentTypesByExtension[extension];
    if (contentType === undefined) {
      throw new Error(`Unsupported image file extension '${extension}'`);
    }
    return contentType;
  }
}
