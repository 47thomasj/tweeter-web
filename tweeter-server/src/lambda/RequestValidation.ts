// Partially written by AI.

import {
  Type,
  type FollowRequest,
  type GetFollowCountRequest,
  type GetIsFollowerStatusRequest,
  type GetUserRequest,
  type LoginRequest,
  type LogoutRequest,
  type PagedStatusItemRequest,
  type PagedUserItemRequest,
  type PostSegmentDto,
  type PostStatusRequest,
  type RegisterRequest,
  type StatusDto,
  type UnfollowRequest,
  type UserDto,
} from "tweeter-shared";

export type RequestValidator<Request extends object> = (
  request: unknown,
) => asserts request is Request;

export class BadRequestError extends Error {
  public constructor(message: string) {
    super(`BadRequest: ${message}`);
    this.name = "BadRequestError";
  }
}

function requireObject(
  value: unknown,
  description: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new BadRequestError(`${description} must be an object`);
  }
}

function requireProperty(
  value: Record<string, unknown>,
  property: string,
  description: string,
): unknown {
  if (!Object.prototype.hasOwnProperty.call(value, property)) {
    throw new BadRequestError(`${description} is required`);
  }

  return value[property];
}

function requireNonEmptyString(
  value: Record<string, unknown>,
  property: string,
  description: string = property,
): string {
  const propertyValue = requireProperty(value, property, description);

  if (
    typeof propertyValue !== "string" ||
    propertyValue.trim().length === 0
  ) {
    throw new BadRequestError(`${description} must be a non-empty string`);
  }

  return propertyValue;
}

function requirePositiveInteger(
  value: Record<string, unknown>,
  property: string,
  description: string = property,
): number {
  const propertyValue = requireProperty(value, property, description);

  if (
    typeof propertyValue !== "number" ||
    !Number.isInteger(propertyValue) ||
    propertyValue <= 0
  ) {
    throw new BadRequestError(`${description} must be a positive integer`);
  }

  return propertyValue;
}

function requireFiniteNumber(
  value: Record<string, unknown>,
  property: string,
  description: string = property,
): number {
  const propertyValue = requireProperty(value, property, description);

  if (
    typeof propertyValue !== "number" ||
    !Number.isFinite(propertyValue)
  ) {
    throw new BadRequestError(`${description} must be a finite number`);
  }

  return propertyValue;
}

function validateUserDto(value: unknown, description: string): UserDto {
  requireObject(value, description);
  requireNonEmptyString(value, "firstName", `${description}.firstName`);
  requireNonEmptyString(value, "lastName", `${description}.lastName`);
  requireNonEmptyString(value, "alias", `${description}.alias`);
  requireNonEmptyString(value, "imageUrl", `${description}.imageUrl`);
  return value as unknown as UserDto;
}

const validSegmentTypes = new Set<string>(Object.values(Type));

function validatePostSegmentDto(
  value: unknown,
  description: string,
): PostSegmentDto {
  requireObject(value, description);
  requireNonEmptyString(value, "text", `${description}.text`);
  const startPosition = requireFiniteNumber(
    value,
    "startPosition",
    `${description}.startPosition`,
  );
  const endPosition = requireFiniteNumber(
    value,
    "endPosition",
    `${description}.endPosition`,
  );
  const type = requireNonEmptyString(value, "type", `${description}.type`);

  if (
    !Number.isInteger(startPosition) ||
    !Number.isInteger(endPosition) ||
    startPosition < 0 ||
    endPosition < startPosition
  ) {
    throw new BadRequestError(
      `${description} positions must be non-negative integers in order`,
    );
  }

  if (!validSegmentTypes.has(type)) {
    throw new BadRequestError(`${description}.type is invalid`);
  }

  return value as unknown as PostSegmentDto;
}

function validateStatusDto(value: unknown, description: string): StatusDto {
  requireObject(value, description);
  requireNonEmptyString(value, "post", `${description}.post`);
  validateUserDto(
    requireProperty(value, "user", `${description}.user`),
    `${description}.user`,
  );
  requireFiniteNumber(value, "timestamp", `${description}.timestamp`);

  const segments = requireProperty(
    value,
    "segments",
    `${description}.segments`,
  );
  if (!Array.isArray(segments)) {
    throw new BadRequestError(`${description}.segments must be an array`);
  }
  segments.forEach((segment, index) =>
    validatePostSegmentDto(segment, `${description}.segments[${index}]`),
  );

  return value as unknown as StatusDto;
}

function validateToken(request: Record<string, unknown>): void {
  requireNonEmptyString(request, "token");
}

export function validateLoginRequest(
  request: unknown,
): asserts request is LoginRequest {
  requireObject(request, "request body");
  requireNonEmptyString(request, "alias");
  requireNonEmptyString(request, "password");
}

export function validateRegisterRequest(
  request: unknown,
): asserts request is RegisterRequest {
  requireObject(request, "request body");
  requireNonEmptyString(request, "alias");
  requireNonEmptyString(request, "password");
  requireNonEmptyString(request, "firstName");
  requireNonEmptyString(request, "lastName");
  requireNonEmptyString(request, "userImageBytes");
  requireNonEmptyString(request, "imageFileExtension");
}

export function validateLogoutRequest(
  request: unknown,
): asserts request is LogoutRequest {
  requireObject(request, "request body");
  validateToken(request);
}

export function validatePagedUserItemRequest(
  request: unknown,
): asserts request is PagedUserItemRequest {
  requireObject(request, "request body");
  validateToken(request);
  requireNonEmptyString(request, "userAlias");
  requirePositiveInteger(request, "pageSize");

  const lastItem = requireProperty(request, "lastItem", "lastItem");
  if (lastItem !== null) {
    validateUserDto(lastItem, "lastItem");
  }
}

export function validatePagedStatusItemRequest(
  request: unknown,
): asserts request is PagedStatusItemRequest {
  requireObject(request, "request body");
  validateToken(request);
  requireNonEmptyString(request, "userAlias");
  requirePositiveInteger(request, "pageSize");

  const lastItem = requireProperty(request, "lastItem", "lastItem");
  if (lastItem !== null) {
    validateStatusDto(lastItem, "lastItem");
  }
}

export function validatePostStatusRequest(
  request: unknown,
): asserts request is PostStatusRequest {
  requireObject(request, "request body");
  validateToken(request);
  validateStatusDto(requireProperty(request, "status", "status"), "status");
}

export function validateGetUserRequest(
  request: unknown,
): asserts request is GetUserRequest {
  requireObject(request, "request body");
  validateToken(request);
  requireNonEmptyString(request, "alias");
}

export function validateGetFollowCountRequest(
  request: unknown,
): asserts request is GetFollowCountRequest {
  requireObject(request, "request body");
  validateToken(request);
  validateUserDto(requireProperty(request, "user", "user"), "user");
}

export function validateGetIsFollowerStatusRequest(
  request: unknown,
): asserts request is GetIsFollowerStatusRequest {
  requireObject(request, "request body");
  validateToken(request);
  validateUserDto(requireProperty(request, "user", "user"), "user");
  validateUserDto(
    requireProperty(request, "selectedUser", "selectedUser"),
    "selectedUser",
  );
}

export function validateFollowRequest(
  request: unknown,
): asserts request is FollowRequest {
  requireObject(request, "request body");
  validateToken(request);
  validateUserDto(
    requireProperty(request, "userToFollow", "userToFollow"),
    "userToFollow",
  );
}

export function validateUnfollowRequest(
  request: unknown,
): asserts request is UnfollowRequest {
  requireObject(request, "request body");
  validateToken(request);
  validateUserDto(
    requireProperty(request, "userToUnfollow", "userToUnfollow"),
    "userToUnfollow",
  );
}
