// Partially written by AI.

import {
  AuthToken,
  GetFollowCountRequest,
  LoginRequest,
  PagedUserItemRequest,
  RegisterRequest,
  UserDto,
} from "tweeter-shared";

export const FOLLOWERS_PAGE_SIZE = 3;
export const INTEGRATION_PASSWORD = "IntegrationPassword123!";

export function makeLoginRequest(
  alias: string,
  overrides: Partial<LoginRequest> = {},
): LoginRequest {
  return {
    alias,
    password: INTEGRATION_PASSWORD,
    ...overrides,
  };
}

export function makeRegisterRequest(
  alias: string,
  overrides: Partial<RegisterRequest> = {},
): RegisterRequest {
  return {
    firstName: "Integration",
    lastName: "Tester",
    alias,
    password: INTEGRATION_PASSWORD,
    userImageBytes: "dGVzdA==",
    imageFileExtension: "png",
    ...overrides,
  };
}

export function makeFollowersRequest(
  token: string,
  userAlias: string,
  overrides: Partial<PagedUserItemRequest> = {},
): PagedUserItemRequest {
  return {
    token,
    userAlias,
    pageSize: FOLLOWERS_PAGE_SIZE,
    lastItem: null,
    ...overrides,
  };
}

export function makeFollowCountRequest(
  token: string,
  user: UserDto,
  overrides: Partial<GetFollowCountRequest> = {},
): GetFollowCountRequest {
  return {
    token,
    user,
    ...overrides,
  };
}

export function expectValidAuthToken(authToken: AuthToken): void {
  expect(authToken).toBeInstanceOf(AuthToken);
  expect(authToken.token).toEqual(expect.any(String));
  expect(authToken.token).not.toHaveLength(0);
  expect(authToken.timestamp).toEqual(expect.any(Number));
  expect(authToken.timestamp).toBeGreaterThan(0);
}

export interface CapturedHttpResult {
  readonly status: number | undefined;
  readonly error: unknown;
}

export function expectHttpError(
  result: CapturedHttpResult,
  status: number,
  message: string,
): void {
  expect(result.status).toBe(status);
  expect(result.error).toBeInstanceOf(Error);
  expect((result.error as Error).message).toContain(
    `HTTP ${status}: ${message}`,
  );
}

export function expectBadRequest(
  result: CapturedHttpResult,
  message = "Bad Request",
): void {
  expectHttpError(result, 400, message);
}

export function expectServerError(result: CapturedHttpResult): void {
  expectHttpError(result, 500, "Server error");
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
