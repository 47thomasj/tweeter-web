/** @jest-environment node */
/**
 * Using Jest, write integration tests to verify 
 * that the Server Facade class correctly communicates with the live server. 
 * Ttest code should directly call the ServerFacade class (ie, no need to involve Services or Presenters). 
 * 
 * CASES:
 * - Register with all valid credentials -> the fake data auth token
 * - Register with invalid credentials -> server error
 * - Register with incomplete credentials -> 400
 * 
 * - Login with valid credentials -> the fake data user and auth token
 * - Login with invalid credentials -> server error
 * - Login with incoplete credentials -> 400
 * 
 * - GetFollowers with valid token and alias -> list of users from fake data
 * - GetFollowers without a token -> 400
 * - GetFollowers without an alias -> 400
 * 
 * - GetFollowingCount with valid token -> number from fake data
 * - GetFollowingCount without a token -> 400
 * - GetFollowingCount without a user -> 400
 */

import {
  AuthToken,
  GetFollowCountRequest,
  LoginRequest,
  PagedUserItemRequest,
  RegisterRequest,
  User,
} from "tweeter-shared";
import { ServerFacade } from "../../src/model/ServerFacade";
import {
  captureHttpResult,
  expectBadRequest,
  expectFakeDataAuthToken,
  FIRST_FAKE_USER,
  getExpectedFollowerDtos,
  makeFollowCountRequest,
  makeFollowersRequest,
  makeInvalidLoginRequest,
  makeInvalidRegisterRequest,
  makeLoginRequest,
  makeRegisterRequest,
  omitRequestField,
} from "./ServerFacade.test-utils";

jest.setTimeout(30_000);

let serverFacade: ServerFacade;
let authenticatedUser: User;
let authToken: AuthToken;

beforeAll(async () => {
  [authenticatedUser, authToken] = await new ServerFacade().login(
    makeLoginRequest(),
  );
});

beforeEach(() => {
  serverFacade = new ServerFacade();
});

describe("ServerFacade.register", () => {
  it("returns the fake-data auth token for valid credentials", async () => {
    const [, returnedAuthToken] = await serverFacade.register(
      makeRegisterRequest(),
    );

    expectFakeDataAuthToken(returnedAuthToken);
  });
});

describe("ServerFacade.login", () => {
  it("returns the fake-data user and auth token for valid credentials", async () => {
    const [user, returnedAuthToken] = await serverFacade.login(
      makeLoginRequest(),
    );

    expect(user.dto).toEqual(FIRST_FAKE_USER.dto);
    expectFakeDataAuthToken(returnedAuthToken);
  });
});

describe("ServerFacade.getMoreFollowers", () => {
  it("returns a page of fake-data users for a valid token and alias", async () => {
    const [followers, hasMore] = await serverFacade.getMoreFollowers(
      makeFollowersRequest(authToken.token),
    );

    expect(followers.map((follower) => follower.dto)).toEqual(
      getExpectedFollowerDtos(),
    );
    expect(hasMore).toBe(true);
  });
});

describe("ServerFacade.getFollowerCount", () => {
  it("returns a fake-data count for a valid token and user", async () => {
    const followerCount = await serverFacade.getFollowerCount(
      makeFollowCountRequest(authToken.token, {
        user: authenticatedUser.dto,
      }),
    );

    expect(Number.isInteger(followerCount)).toBe(true);
    expect(followerCount).toBeGreaterThanOrEqual(1);
    expect(followerCount).toBeLessThanOrEqual(10);
  });
});