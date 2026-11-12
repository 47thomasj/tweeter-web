// Partially written by AI.

import {
  AuthToken,
  FakeData,
  FollowRequest,
  GetFollowCountRequest,
  GetIsFollowerStatusRequest,
  GetUserRequest,
  LoginRequest,
  LogoutRequest,
  PagedStatusItemRequest,
  PagedUserItemRequest,
  PostStatusRequest,
  RegisterRequest,
  UnfollowRequest,
  UserDto,
} from "tweeter-shared";

export const FOLLOWERS_PAGE_SIZE = 3;

const firstFakeUser = FakeData.instance.firstUser;

if (firstFakeUser === null) {
  throw new Error("The integration tests require at least one fake user");
}

export const FIRST_FAKE_USER = firstFakeUser;

const firstFakeStatus = FakeData.instance.fakeStatuses[0];

if (firstFakeStatus === undefined) {
  throw new Error("The integration tests require at least one fake status");
}

export const FIRST_FAKE_STATUS = firstFakeStatus;

export function makeLoginRequest(
  overrides: Partial<LoginRequest> = {},
): LoginRequest {
  return {
    alias: FIRST_FAKE_USER.alias,
    password: "password",
    ...overrides,
  };
}

export function makeInvalidLoginRequest(): LoginRequest {
  return makeLoginRequest({
    alias: "@user-that-does-not-exist",
    password: "incorrect-password",
  });
}

export function makeRegisterRequest(
  overrides: Partial<RegisterRequest> = {},
): RegisterRequest {
  return {
    firstName: "Integration",
    lastName: "Tester",
    alias: "@integration-tester",
    password: "valid-password",
    userImageBytes: "dGVzdA==",
    imageFileExtension: "png",
    ...overrides,
  };
}

export function makeInvalidRegisterRequest(): RegisterRequest {
  return makeRegisterRequest({
    firstName: "",
    lastName: "",
    alias: "invalid-alias",
    password: "x",
  });
}

export function makeLogoutRequest(
  token: string,
  overrides: Partial<LogoutRequest> = {},
): LogoutRequest {
  return {
    token,
    ...overrides,
  };
}

export function makeFollowersRequest(
  token: string,
  overrides: Partial<PagedUserItemRequest> = {},
): PagedUserItemRequest {
  return {
    token,
    userAlias: FIRST_FAKE_USER.alias,
    pageSize: FOLLOWERS_PAGE_SIZE,
    lastItem: null,
    ...overrides,
  };
}

export function makeStatusPageRequest(
  token: string,
  overrides: Partial<PagedStatusItemRequest> = {},
): PagedStatusItemRequest {
  return {
    token,
    userAlias: FIRST_FAKE_USER.alias,
    pageSize: FOLLOWERS_PAGE_SIZE,
    lastItem: null,
    ...overrides,
  };
}

export function makePostStatusRequest(
  token: string,
  overrides: Partial<PostStatusRequest> = {},
): PostStatusRequest {
  return {
    token,
    status: FIRST_FAKE_STATUS.dto,
    ...overrides,
  };
}

export function makeGetUserRequest(
  token: string,
  overrides: Partial<GetUserRequest> = {},
): GetUserRequest {
  return {
    token,
    alias: FIRST_FAKE_USER.alias,
    ...overrides,
  };
}

export function makeFollowCountRequest(
  token: string,
  overrides: Partial<GetFollowCountRequest> = {},
): GetFollowCountRequest {
  return {
    token,
    user: FIRST_FAKE_USER.dto,
    ...overrides,
  };
}

export function makeIsFollowerStatusRequest(
  token: string,
  overrides: Partial<GetIsFollowerStatusRequest> = {},
): GetIsFollowerStatusRequest {
  return {
    token,
    user: FIRST_FAKE_USER.dto,
    selectedUser: FIRST_FAKE_USER.dto,
    ...overrides,
  };
}

export function makeFollowRequest(
  token: string,
  overrides: Partial<FollowRequest> = {},
): FollowRequest {
  return {
    token,
    userToFollow: FIRST_FAKE_USER.dto,
    ...overrides,
  };
}

export function makeUnfollowRequest(
  token: string,
  overrides: Partial<UnfollowRequest> = {},
): UnfollowRequest {
  return {
    token,
    userToUnfollow: FIRST_FAKE_USER.dto,
    ...overrides,
  };
}

export function omitRequestField<T extends object, K extends keyof T>(
  request: T,
  field: K,
): Omit<T, K> {
  const { [field]: omitted, ...incompleteRequest } = request;
  void omitted;
  return incompleteRequest;
}

export function getExpectedFollowerDtos(): UserDto[] {
  return FakeData.instance.fakeUsers
    .filter((user) => user.alias !== FIRST_FAKE_USER.alias)
    .slice(0, FOLLOWERS_PAGE_SIZE)
    .map((user) => user.dto);
}

export function expectFakeDataAuthToken(authToken: AuthToken): void {
  expect(authToken).toBeInstanceOf(AuthToken);
  expect(authToken.token).toEqual(expect.any(String));
  expect(authToken.token).not.toHaveLength(0);
  expect(authToken.timestamp).toEqual(expect.any(Number));
  expect(authToken.timestamp).toBeGreaterThan(0);
}

interface CapturedHttpResult {
  readonly status: number | undefined;
  readonly error: unknown;
}

export function expectBadRequest(result: CapturedHttpResult): void {
  expect(result.status).toBe(400);
  expect(result.error).toBeInstanceOf(Error);
}

export async function captureHttpResult(
  action: () => Promise<unknown>,
): Promise<CapturedHttpResult> {
  const originalFetch = globalThis.fetch;
  let status: number | undefined;
  let error: unknown;

  const fetchSpy = jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      status = response.status;
      return response;
    });

  try {
    await action();
  } catch (caughtError) {
    error = caughtError;
  } finally {
    fetchSpy.mockRestore();
  }

  return { status, error };
}
