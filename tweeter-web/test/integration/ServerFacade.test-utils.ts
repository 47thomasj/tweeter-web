// Partially written by AI.

import {
  AuthToken,
  FakeData,
  GetFollowCountRequest,
  LoginRequest,
  PagedUserItemRequest,
  RegisterRequest,
  UserDto,
} from "tweeter-shared";

export const FOLLOWERS_PAGE_SIZE = 3;

const firstFakeUser = FakeData.instance.firstUser;

if (firstFakeUser === null) {
  throw new Error("The integration tests require at least one fake user");
}

export const FIRST_FAKE_USER = firstFakeUser;

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
