// Partially written by AI.
import type { Dao } from "./Dao";

export interface ImageData {
  fileName: string;
  imageBytes: Uint8Array;
}

export interface ImageDao extends Dao<ImageData, [fileName: string]> {
  getImageUrl(fileName: string): string;
}