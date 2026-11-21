// Partially written by AI.

import {
  Type,
  type PostSegmentDto,
  type StatusDto,
  type UserDto,
} from "tweeter-shared";
import { ClientError } from "./ClientError";

const supportedImageFileExtensions = new Set([
  "gif",
  "jpeg",
  "jpg",
  "png",
  "webp",
]);

function throwBadRequest(): never {
  throw new ClientError("Bad Request");
}

export function requireNonEmptyStrings(
  ...values: Array<string | null | undefined>
): void {
  if (values.some((value) => typeof value !== "string" || value.length === 0)) {
    throwBadRequest();
  }
}

export function requirePositiveNumber(value: number | null | undefined): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throwBadRequest();
  }
}

export function requireNonEmptyBytes(
  value: Uint8Array | null | undefined,
): void {
  if (!(value instanceof Uint8Array) || value.byteLength === 0) {
    throwBadRequest();
  }
}

export function requireSupportedImageFileExtension(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    throwBadRequest();
  }
  const normalizedValue = value.toLowerCase().replace(/^\./, "");
  if (!supportedImageFileExtensions.has(normalizedValue)) {
    throwBadRequest();
  }
  return normalizedValue;
}

export function requireUserDto(user: UserDto | null | undefined): void {
  if (user === null || user === undefined) {
    throwBadRequest();
  }

  requireNonEmptyStrings(
    user.firstName,
    user.lastName,
    user.alias,
    user.imageUrl,
  );
}

export function requireStatusDto(status: StatusDto | null | undefined): void {
  if (status === null || status === undefined) {
    throwBadRequest();
  }

  requireNonEmptyStrings(status.post);
  if (status.post.trim().length === 0) {
    throwBadRequest();
  }
  requireUserDto(status.user);
  requirePositiveNumber(status.timestamp);
  if (!Number.isInteger(status.timestamp)) {
    throwBadRequest();
  }

  if (!Array.isArray(status.segments) || status.segments.length === 0) {
    throwBadRequest();
  }

  for (const segment of status.segments as Array<
    PostSegmentDto | null | undefined
  >) {
    if (segment === null || segment === undefined) {
      throwBadRequest();
    }
    requireNonEmptyStrings(segment.text);

    if (
      !Number.isInteger(segment.startPosition) ||
      !Number.isInteger(segment.endPosition) ||
      segment.startPosition < 0 ||
      segment.endPosition < segment.startPosition ||
      segment.endPosition > status.post.length ||
      !Object.values(Type).includes(segment.type)
    ) {
      throwBadRequest();
    }
  }
}
