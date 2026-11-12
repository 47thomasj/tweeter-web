/** @jest-environment node */
/**
 * Verifies that ServerFacade communicates correctly with every live API route.
 */

import { AuthToken, User } from "tweeter-shared";
import { ServerFacade } from "../../src/model/ServerFacade";
import {
  captureHttpResult,
  expectBadRequest,
  expectFakeDataAuthToken,
  FIRST_FAKE_USER,
  getExpectedFollowerDtos,
  makeFollowRequest,
  makeFollowCountRequest,
  makeFollowersRequest,
  makeGetUserRequest,
  makeIsFollowerStatusRequest,
  makeLoginRequest,
  makeLogoutRequest,
  makePostStatusRequest,
  makeRegisterRequest,
  makeStatusPageRequest,
  makeUnfollowRequest,
  omitRequestField,
} from "./ServerFacade.test-utils";

jest.setTimeout(30_000);

let serverFacade: ServerFacade;
let authenticatedUser: User;
let authToken: AuthToken;

interface EndpointBadRequestCase {
  readonly name: string;
  readonly action: () => Promise<unknown>;
}

function withoutRequiredField<
  Request extends object,
  Field extends keyof Request,
>(request: Request, field: Field): Request {
  return omitRequestField(request, field) as unknown as Request;
}

const endpointBadRequestCases: EndpointBadRequestCase[] = [
  {
    name: "POST /register",
    action: () =>
      serverFacade.register(
        withoutRequiredField(makeRegisterRequest(), "firstName"),
      ),
  },
  {
    name: "POST /login",
    action: () =>
      serverFacade.login(withoutRequiredField(makeLoginRequest(), "alias")),
  },
  {
    name: "POST /logout",
    action: () =>
      serverFacade.logout(
        withoutRequiredField(makeLogoutRequest(authToken.token), "token"),
      ),
  },
  {
    name: "POST /followees",
    action: () =>
      serverFacade.getMoreFollowees(
        withoutRequiredField(
          makeFollowersRequest(authToken.token),
          "userAlias",
        ),
      ),
  },
  {
    name: "POST /followers",
    action: () =>
      serverFacade.getMoreFollowers(
        withoutRequiredField(makeFollowersRequest(authToken.token), "token"),
      ),
  },
  {
    name: "POST /feed-items",
    action: () =>
      serverFacade.loadMoreFeedItems(
        withoutRequiredField(
          makeStatusPageRequest(authToken.token),
          "userAlias",
        ),
      ),
  },
  {
    name: "POST /story-items",
    action: () =>
      serverFacade.loadMoreStoryItems(
        withoutRequiredField(
          makeStatusPageRequest(authToken.token),
          "pageSize",
        ),
      ),
  },
  {
    name: "POST /post-status",
    action: () =>
      serverFacade.postStatus(
        withoutRequiredField(
          makePostStatusRequest(authToken.token),
          "status",
        ),
      ),
  },
  {
    name: "POST /user",
    action: () =>
      serverFacade.getUser(
        withoutRequiredField(makeGetUserRequest(authToken.token), "alias"),
      ),
  },
  {
    name: "POST /is-follower-status",
    action: () =>
      serverFacade.getIsFollowerStatus(
        withoutRequiredField(
          makeIsFollowerStatusRequest(authToken.token),
          "selectedUser",
        ),
      ),
  },
  {
    name: "POST /followee-count",
    action: () =>
      serverFacade.getFolloweeCount(
        withoutRequiredField(
          makeFollowCountRequest(authToken.token),
          "user",
        ),
      ),
  },
  {
    name: "POST /follower-count",
    action: () =>
      serverFacade.getFollowerCount(
        withoutRequiredField(
          makeFollowCountRequest(authToken.token),
          "token",
        ),
      ),
  },
  {
    name: "POST /follow",
    action: () =>
      serverFacade.follow(
        withoutRequiredField(
          makeFollowRequest(authToken.token),
          "userToFollow",
        ),
      ),
  },
  {
    name: "POST /unfollow",
    action: () =>
      serverFacade.unfollow(
        withoutRequiredField(
          makeUnfollowRequest(authToken.token),
          "userToUnfollow",
        ),
      ),
  },
];

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

describe.each(endpointBadRequestCases)("$name error response", ({ action }) => {
  it("returns HTTP 400 for a malformed request body", async () => {
    const result = await captureHttpResult(action);

    expectBadRequest(result);
  });
});