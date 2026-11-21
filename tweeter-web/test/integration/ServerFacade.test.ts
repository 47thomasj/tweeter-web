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
  Type,
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

function makeStatusDto(
  user: UserDto,
  post: string,
  timestamp = Date.now(),
): StatusDto {
  return {
    post,
    user,
    timestamp,
    segments: [
      {
        text: post,
        startPosition: 0,
        endPosition: post.length,
        type: Type.text,
      },
    ],
  };
}

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

describe("ServerFacade.getUser", () => {
  it("returns a persisted user", async () => {
    const user = await serverFacade.getUser({
      token: authToken.token,
      alias: primaryUser.alias,
    });

    expect(user?.dto).toEqual(primaryUser);
  });
});

describe("ServerFacade session expiration", () => {
  it("extends a valid session after authenticated activity", async () => {
    const originalExpiresAt = Math.floor(Date.now() / 1000) + 60;
    const slidingToken = await harness.seedSession(
      primaryUser.alias,
      "sliding-session",
      originalExpiresAt,
    );

    await serverFacade.getUser({
      token: slidingToken.token,
      alias: primaryUser.alias,
    });

    const refreshedSession = await harness.getSession(slidingToken.token);
    expect(refreshedSession?.expires_at).toBeGreaterThan(
      originalExpiresAt,
    );
  });

  it("rejects and deletes an expired session", async () => {
    const expiredToken = await harness.seedSession(
      primaryUser.alias,
      "expired-session",
      Math.floor(Date.now() / 1000) - 1,
    );

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.getUser({
          token: expiredToken.token,
          alias: primaryUser.alias,
        }),
      ),
      "Session expired",
    );
    expect(await harness.getSession(expiredToken.token)).toBeUndefined();
  });
});

describe("ServerFacade follow lifecycle", () => {
  it("follows, lists, counts, and unfollows a user", async () => {
    const selectedUser = followerUsers[0];
    harness.trackApiFollow(primaryUser.alias, selectedUser.alias);

    expect(
      await serverFacade.getIsFollowerStatus({
        token: authToken.token,
        user: primaryUser,
        selectedUser,
      }),
    ).toBe(false);

    const followCounts = await serverFacade.follow({
      token: authToken.token,
      userToFollow: selectedUser,
    });
    expect(followCounts).toEqual([
      expect.any(Number),
      expect.any(Number),
    ]);
    await harness.waitForFollowerIndex(
      primaryUser.alias,
      selectedUser.alias,
    );

    expect(
      await serverFacade.getIsFollowerStatus({
        token: authToken.token,
        user: primaryUser,
        selectedUser,
      }),
    ).toBe(true);

    const [followees] = await serverFacade.getMoreFollowees({
      token: authToken.token,
      userAlias: primaryUser.alias,
      pageSize: 10,
      lastItem: null,
    });
    expect(followees.map((user) => user.dto)).toContainEqual(selectedUser);

    const [followers] = await serverFacade.getMoreFollowers({
      token: authToken.token,
      userAlias: selectedUser.alias,
      pageSize: 10,
      lastItem: null,
    });
    expect(followers.map((user) => user.dto)).toContainEqual(primaryUser);

    expect(
      await serverFacade.getFolloweeCount(
        makeFollowCountRequest(authToken.token, primaryUser),
      ),
    ).toBe(1);
    expect(
      await serverFacade.getFollowerCount(
        makeFollowCountRequest(authToken.token, selectedUser),
      ),
    ).toBe(1);

    const unfollowCounts = await serverFacade.unfollow({
      token: authToken.token,
      userToUnfollow: selectedUser,
    });
    expect(unfollowCounts).toEqual([
      expect.any(Number),
      expect.any(Number),
    ]);
    await harness.waitForFollowerIndexRemoval(
      primaryUser.alias,
      selectedUser.alias,
    );

    expect(
      await serverFacade.getIsFollowerStatus({
        token: authToken.token,
        user: primaryUser,
        selectedUser,
      }),
    ).toBe(false);
    expect(
      await serverFacade.getFolloweeCount(
        makeFollowCountRequest(authToken.token, primaryUser),
      ),
    ).toBe(0);
    expect(
      await serverFacade.getFollowerCount(
        makeFollowCountRequest(authToken.token, selectedUser),
      ),
    ).toBe(0);
  });
});

describe("ServerFacade follow constraints", () => {
  it("rejects following yourself", async () => {
    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.follow({
          token: authToken.token,
          userToFollow: primaryUser,
        }),
      ),
      "Cannot follow yourself",
    );
  });

  it("rejects following a user who does not exist", async () => {
    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.follow({
          token: authToken.token,
          userToFollow: harness.makeUser("missing-follow-target"),
        }),
      ),
      "User does not exist",
    );
  });

  it("rejects duplicate follows", async () => {
    const target = harness.makeUser("duplicate-follow-target");
    await harness.seedUser(target);
    await harness.seedFollow(primaryUser.alias, target.alias);

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.follow({
          token: authToken.token,
          userToFollow: target,
        }),
      ),
      "Already following user",
    );
  });

  it("rejects unfollowing a user who is not followed", async () => {
    const target = harness.makeUser("missing-unfollow-target");
    await harness.seedUser(target);

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.unfollow({
          token: authToken.token,
          userToUnfollow: target,
        }),
      ),
      "Not following user",
    );
  });
});

describe("ServerFacade.postStatus", () => {
  it("persists a story item and fans it out to every follower", async () => {
    const post = `Integration status ${Date.now()}`;
    const status: StatusDto = {
      post,
      user: primaryUser,
      timestamp: Date.now(),
      segments: [
        {
          text: post,
          startPosition: 0,
          endPosition: post.length,
          type: Type.text,
        },
      ],
    };
    harness.trackApiStatus(primaryUser.alias, status.timestamp);
    for (const follower of followerUsers) {
      harness.trackApiFeedReference(
        follower.alias,
        primaryUser.alias,
        status.timestamp,
      );
    }

    await serverFacade.postStatus({
      token: authToken.token,
      status,
    });

    expect(
      await harness.getStatus(primaryUser.alias, status.timestamp),
    ).toEqual(
      expect.objectContaining({
        user_alias: primaryUser.alias,
        timestamp: status.timestamp,
        post,
      }),
    );

    const [storyItems] = await serverFacade.loadMoreStoryItems({
      token: authToken.token,
      userAlias: primaryUser.alias,
      pageSize: 10,
      lastItem: null,
    });
    expect(storyItems.map((item) => item.dto)).toContainEqual(status);

    for (const follower of followerUsers) {
      expect(
        await harness.getFeedReference(
          follower.alias,
          primaryUser.alias,
          status.timestamp,
        ),
      ).toEqual({
        feed_user_alias: follower.alias,
        sort_key: harness.feedSortKey(
          primaryUser.alias,
          status.timestamp,
        ),
        status_user_alias: primaryUser.alias,
        timestamp: status.timestamp,
      });

      const [feedItems] = await serverFacade.loadMoreFeedItems({
        token: authToken.token,
        userAlias: follower.alias,
        pageSize: 10,
        lastItem: null,
      });
      expect(feedItems.map((item) => item.dto)).toContainEqual(status);
    }
  });

  it("rejects spoofed author data", async () => {
    const status = makeStatusDto(
      { ...primaryUser, imageUrl: "https://example.com/spoofed.png" },
      `Spoofed author ${Date.now()}`,
    );
    harness.trackApiStatus(primaryUser.alias, status.timestamp);
    for (const follower of followerUsers) {
      harness.trackApiFeedReference(
        follower.alias,
        primaryUser.alias,
        status.timestamp,
      );
    }

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.postStatus({
          token: authToken.token,
          status,
        }),
      ),
      "Action Not Allowed",
    );
  });

  it("rejects malformed post segments", async () => {
    const status = makeStatusDto(
      primaryUser,
      `Malformed segments ${Date.now()}`,
    );
    status.segments[0]!.startPosition = -1;
    harness.trackApiStatus(primaryUser.alias, status.timestamp);
    for (const follower of followerUsers) {
      harness.trackApiFeedReference(
        follower.alias,
        primaryUser.alias,
        status.timestamp,
      );
    }

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.postStatus({
          token: authToken.token,
          status,
        }),
      ),
    );
  });

  it("rejects overwriting an existing status", async () => {
    const status = makeStatusDto(
      primaryUser,
      `Duplicate status ${Date.now()}`,
    );
    await harness.seedStatus(status);
    for (const follower of followerUsers) {
      harness.trackApiFeedReference(
        follower.alias,
        primaryUser.alias,
        status.timestamp,
      );
    }

    expectBadRequest(
      await captureHttpResult(() =>
        serverFacade.postStatus({
          token: authToken.token,
          status,
        }),
      ),
      "Status already exists",
    );
  });

  it("keeps posts from different authors with the same timestamp", async () => {
    const secondAuthor = harness.makeUser("same-time-author");
    await harness.seedUser(secondAuthor);
    const secondAuthorToken = await harness.seedSession(
      secondAuthor.alias,
      "same-time-author-session",
    );

    const feedOwner = followerUsers[0];
    await harness.seedFollow(feedOwner.alias, secondAuthor.alias);
    await harness.waitForFollowerIndex(
      feedOwner.alias,
      secondAuthor.alias,
    );

    const timestamp = Date.now();
    const firstStatus = makeStatusDto(
      primaryUser,
      "First simultaneous status",
      timestamp,
    );
    const secondStatus = makeStatusDto(
      secondAuthor,
      "Second simultaneous status",
      timestamp,
    );
    harness.trackApiStatus(primaryUser.alias, timestamp);
    harness.trackApiStatus(secondAuthor.alias, timestamp);
    for (const follower of followerUsers) {
      harness.trackApiFeedReference(
        follower.alias,
        primaryUser.alias,
        timestamp,
      );
    }
    harness.trackApiFeedReference(
      feedOwner.alias,
      secondAuthor.alias,
      timestamp,
    );

    await serverFacade.postStatus({
      token: authToken.token,
      status: firstStatus,
    });
    await serverFacade.postStatus({
      token: secondAuthorToken.token,
      status: secondStatus,
    });

    expect(
      await harness.getFeedReference(
        feedOwner.alias,
        primaryUser.alias,
        timestamp,
      ),
    ).toBeDefined();
    expect(
      await harness.getFeedReference(
        feedOwner.alias,
        secondAuthor.alias,
        timestamp,
      ),
    ).toBeDefined();

    const [feedItems] = await serverFacade.loadMoreFeedItems({
      token: authToken.token,
      userAlias: feedOwner.alias,
      pageSize: 10,
      lastItem: null,
    });
    expect(feedItems.map((item) => item.dto)).toEqual(
      expect.arrayContaining([firstStatus, secondStatus]),
    );
  });
});

describe("ServerFacade.logout", () => {
  it("deletes the persisted session", async () => {
    const logoutToken = await harness.seedSession(
      primaryUser.alias,
      "logout-session",
    );

    await serverFacade.logout({ token: logoutToken.token });

    expect(await harness.getSession(logoutToken.token)).toBeUndefined();
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