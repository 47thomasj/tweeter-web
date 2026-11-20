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

import { Buffer } from "buffer";
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
  UserDto,
} from "tweeter-shared";
import { ServerFacade } from "../../src/model/ServerFacade";
import {
  captureHttpResult,
  expectBadRequest,
  expectServerError,
  expectValidAuthToken,
  FOLLOWERS_PAGE_SIZE,
  INTEGRATION_PASSWORD,
  makeFollowCountRequest,
  makeFollowersRequest,
  makeLoginRequest,
  makeRegisterRequest,
} from "./ServerFacade.test-utils";
import { DynamoTestHarness } from "./DynamoTestHarness";

jest.setTimeout(60_000);

let serverFacade: ServerFacade;
let harness: DynamoTestHarness;
let primaryUser: UserDto;
let followerUsers: UserDto[];
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
  harness = await DynamoTestHarness.create("server-facade");
  primaryUser = harness.makeUser("primary");
  followerUsers = ["follower-a", "follower-b", "follower-c", "follower-d"].map(
    (label) => harness.makeUser(label),
  );

  await harness.seedUser(primaryUser);
  await harness.seedCredentials(primaryUser.alias, INTEGRATION_PASSWORD);
  authToken = await harness.seedSession(primaryUser.alias, "primary-session");

  for (const follower of followerUsers) {
    await harness.seedUser(follower);
    await harness.seedFollow(follower.alias, primaryUser.alias);
  }
  for (const follower of followerUsers) {
    await harness.waitForFollowerIndex(
      follower.alias,
      primaryUser.alias,
    );
  }
});

afterAll(async () => {
  if (harness) {
    await harness.cleanup();
  }
});

beforeEach(() => {
  serverFacade = new ServerFacade();
});

describe("ServerFacade.register", () => {
  it("persists a user, credentials, and session for valid credentials", async () => {
    const alias = harness.alias("registered");
    const request = makeRegisterRequest(alias);
    const expectedImageUrl = harness.imageUrl(
      alias,
      request.imageFileExtension,
    );
    harness.trackApiRegistration(alias, request.imageFileExtension);

    const [user, returnedAuthToken] =
      await serverFacade.register(request);
    harness.trackSession(returnedAuthToken.token, alias);

    expect(user.dto).toEqual({
      firstName: request.firstName,
      lastName: request.lastName,
      alias,
      imageUrl: expectedImageUrl,
    });
    expectValidAuthToken(returnedAuthToken);
    expect(await harness.getUser(alias)).toEqual({
      alias,
      first_name: request.firstName,
      last_name: request.lastName,
      image_url: expectedImageUrl,
    });
    expect(await harness.getCredentials(alias)).toEqual({
      alias,
      password_hash: expect.any(String),
    });
    expect(await harness.getSession(returnedAuthToken.token)).toEqual(
      expect.objectContaining({
        token: returnedAuthToken.token,
        user_alias: alias,
      }),
    );

    const imageResponse = await fetch(expectedImageUrl);
    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("content-type")).toBe("image/png");
    expect(
      Buffer.from(await imageResponse.arrayBuffer()).toString("base64"),
    ).toBe(request.userImageBytes);
  });

  it("returns 400 when the alias is already registered", async () => {
    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.register(makeRegisterRequest(primaryUser.alias)),
      ),
      "Alias is already registered",
    );
  });
});

describe("ServerFacade.login", () => {
  it("returns the persisted user and creates a session", async () => {
    const [user, returnedAuthToken] = await serverFacade.login(
      makeLoginRequest(primaryUser.alias),
    );
    harness.trackSession(returnedAuthToken.token, primaryUser.alias);

    expect(user.dto).toEqual(primaryUser);
    expectValidAuthToken(returnedAuthToken);
    expect(await harness.getSession(returnedAuthToken.token)).toEqual(
      expect.objectContaining({
        token: returnedAuthToken.token,
        user_alias: primaryUser.alias,
      }),
    );
  });

  it("returns 400 for an invalid password", async () => {
    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.login(
          makeLoginRequest(primaryUser.alias, {
            password: "incorrect-password",
          }),
        ),
      ),
      "Invalid password",
    );
  });

  it("returns 400 for an unknown alias", async () => {
    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.login(
          makeLoginRequest(harness.alias("unknown-user")),
        ),
      ),
      "Invalid alias",
    );
  });
});

describe("ServerFacade.getMoreFollowers", () => {
  it("returns an ordered page of persisted followers", async () => {
    const [followers, hasMore] = await serverFacade.getMoreFollowers(
      makeFollowersRequest(authToken.token, primaryUser.alias),
    );

    expect(followers.map((follower) => follower.dto)).toEqual(
      followerUsers.slice(0, FOLLOWERS_PAGE_SIZE),
    );
    expect(hasMore).toBe(true);
  });
});

describe("ServerFacade.getFollowerCount", () => {
  it("returns the persisted follower count", async () => {
    const followerCount = await serverFacade.getFollowerCount(
      makeFollowCountRequest(authToken.token, primaryUser),
    );

    expect(followerCount).toBe(followerUsers.length);
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

describe("ServerFacade database failures", () => {
  it("returns 500 when an auth record is malformed", async () => {
    const user = harness.makeUser("malformed-auth");
    await harness.seedUser(user);
    await harness.seedMalformedCredentials(user.alias);

    expectServerError(
      await captureHttpResult(() =>
        serverFacade.login(makeLoginRequest(user.alias)),
      ),
    );
  });

  it("returns 500 when a follow references a missing user", async () => {
    const missingFollowerAlias = harness.alias("missing-follower");
    const followeeAlias = harness.alias("dangling-follow-target");
    await harness.seedFollow(missingFollowerAlias, followeeAlias);
    await harness.waitForFollowerIndex(
      missingFollowerAlias,
      followeeAlias,
    );

    expectServerError(
      await captureHttpResult(() =>
        serverFacade.getMoreFollowers(
          makeFollowersRequest(authToken.token, followeeAlias, {
            pageSize: 10,
          }),
        ),
      ),
    );
  });

  it("returns 500 when a user record is malformed", async () => {
    const alias = harness.alias("malformed-user");
    await harness.seedMalformedUser(alias);

    expectServerError(
      await captureHttpResult(() =>
        serverFacade.getUser({
          token: authToken.token,
          alias,
        }),
      ),
    );
  });
});