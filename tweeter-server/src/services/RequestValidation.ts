// Partially written by AI.

import { StatusDto, UserDto } from "tweeter-shared";

function throwBadRequest(): never {
  throw new Error("Bad Request");
}

export function requireNonEmptyStrings(
  ...values: Array<string | null | undefined>
): void {
  if (values.some((value) => typeof value !== "string" || value.length === 0)) {
    throwBadRequest();
  }
}

export function requirePositiveNumber(
  value: number | null | undefined,
): void {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0
  ) {
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

export function requireUserDto(
  user: UserDto | null | undefined,
): void {
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

export function requireStatusDto(
  status: StatusDto | null | undefined,
): void {
  if (status === null || status === undefined) {
    throwBadRequest();
  }

  requireNonEmptyStrings(status.post);
  requireUserDto(status.user);
  requirePositiveNumber(status.timestamp);

  if (!Array.isArray(status.segments) || status.segments.length === 0) {
    throwBadRequest();
  }
}
