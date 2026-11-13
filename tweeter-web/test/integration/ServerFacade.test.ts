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
  StatusDto,
  UnfollowRequest,
  User,
  UserDto,
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
  makeLoginRequest,
  makeRegisterRequest,
} from "./ServerFacade.test-utils";

jest.setTimeout(30_000);

let serverFacade: ServerFacade;
let authenticatedUser: User;
let authToken: AuthToken;

const EMPTY_USER_DTO: UserDto = {
  firstName: "",
  lastName: "",
  alias: "",
  imageUrl: "",
};

const EMPTY_STATUS_DTO: StatusDto = {
  post: "",
  user: EMPTY_USER_DTO,
  timestamp: 0,
  segments: [],
};

const EMPTY_LOGIN_REQUEST: LoginRequest = {
  alias: "",
  password: "",
};

const EMPTY_REGISTER_REQUEST: RegisterRequest = {
  ...EMPTY_LOGIN_REQUEST,
  firstName: "",
  lastName: "",
  userImageBytes: "",
  imageFileExtension: "",
};

const EMPTY_LOGOUT_REQUEST: LogoutRequest = {
  token: "",
};

const EMPTY_PAGED_USER_REQUEST: PagedUserItemRequest = {
  token: "",
  userAlias: "",
  pageSize: 0,
  lastItem: null,
};

const EMPTY_PAGED_STATUS_REQUEST: PagedStatusItemRequest = {
  token: "",
  userAlias: "",
  pageSize: 0,
  lastItem: null,
};

const EMPTY_POST_STATUS_REQUEST: PostStatusRequest = {
  token: "",
  status: EMPTY_STATUS_DTO,
};

const EMPTY_GET_USER_REQUEST: GetUserRequest = {
  token: "",
  alias: "",
};

const EMPTY_FOLLOWER_STATUS_REQUEST: GetIsFollowerStatusRequest = {
  token: "",
  user: EMPTY_USER_DTO,
  selectedUser: EMPTY_USER_DTO,
};

const EMPTY_FOLLOW_COUNT_REQUEST: GetFollowCountRequest = {
  token: "",
  user: EMPTY_USER_DTO,
};

const EMPTY_FOLLOW_REQUEST: FollowRequest = {
  token: "",
  userToFollow: EMPTY_USER_DTO,
};

const EMPTY_UNFOLLOW_REQUEST: UnfollowRequest = {
  token: "",
  userToUnfollow: EMPTY_USER_DTO,
};

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

describe("ServerFacade empty requests", () => {
  const testCases: Array<{
    endpoint: string;
    action: () => Promise<unknown>;
  }> = [
    {
      endpoint: "POST /register",
      action: () => serverFacade.register(EMPTY_REGISTER_REQUEST),
    },
    {
      endpoint: "POST /login",
      action: () => serverFacade.login(EMPTY_LOGIN_REQUEST),
    },
    {
      endpoint: "POST /logout",
      action: () => serverFacade.logout(EMPTY_LOGOUT_REQUEST),
    },
    {
      endpoint: "POST /followees",
      action: () => serverFacade.getMoreFollowees(EMPTY_PAGED_USER_REQUEST),
    },
    {
      endpoint: "POST /followers",
      action: () => serverFacade.getMoreFollowers(EMPTY_PAGED_USER_REQUEST),
    },
    {
      endpoint: "POST /feed-items",
      action: () => serverFacade.loadMoreFeedItems(EMPTY_PAGED_STATUS_REQUEST),
    },
    {
      endpoint: "POST /story-items",
      action: () => serverFacade.loadMoreStoryItems(EMPTY_PAGED_STATUS_REQUEST),
    },
    {
      endpoint: "POST /post-status",
      action: () => serverFacade.postStatus(EMPTY_POST_STATUS_REQUEST),
    },
    {
      endpoint: "POST /user",
      action: () => serverFacade.getUser(EMPTY_GET_USER_REQUEST),
    },
    {
      endpoint: "POST /is-follower-status",
      action: () =>
        serverFacade.getIsFollowerStatus(EMPTY_FOLLOWER_STATUS_REQUEST),
    },
    {
      endpoint: "POST /followee-count",
      action: () => serverFacade.getFolloweeCount(EMPTY_FOLLOW_COUNT_REQUEST),
    },
    {
      endpoint: "POST /follower-count",
      action: () => serverFacade.getFollowerCount(EMPTY_FOLLOW_COUNT_REQUEST),
    },
    {
      endpoint: "POST /follow",
      action: () => serverFacade.follow(EMPTY_FOLLOW_REQUEST),
    },
    {
      endpoint: "POST /unfollow",
      action: () => serverFacade.unfollow(EMPTY_UNFOLLOW_REQUEST),
    },
  ];

  it.each(testCases)(
    "$endpoint returns 400",
    async ({ action }) => {
      expectBadRequest(await captureHttpResult(action));
    },
  );
});