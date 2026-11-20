/** @jest-environment node */ // Partially written by AI.

import {
  AuthToken,
  Status,
  StatusDto,
  Type,
  UserDto,
} from "tweeter-shared";
import { StatusService } from "../../src/model/service/StatusService";
import { DynamoTestHarness } from "./DynamoTestHarness";
import {
  captureHttpResult,
  expectServerError,
} from "./ServerFacade.test-utils";

describe("loadMoreStoryItems", () => {
  const pageSize = 10;

  let harness: DynamoTestHarness;
  let statusService: StatusService;
  let authToken: AuthToken;
  let user: UserDto;
  let expectedStatuses: StatusDto[];

  beforeAll(async () => {
    harness = await DynamoTestHarness.create("status-service");
    user = harness.makeUser("story-user");
    await harness.seedUser(user);
    authToken = await harness.seedSession(
      user.alias,
      "story-session",
    );

    const firstTimestamp = Date.now() - 60_000;
    expectedStatuses = Array.from({ length: pageSize + 1 }, (_, index) => {
      const post = `Persisted story status ${index}`;
      return {
        post,
        user,
        timestamp: firstTimestamp + index,
        segments: [
          {
            text: post,
            startPosition: 0,
            endPosition: post.length,
            type: Type.text,
          },
        ],
      };
    }).sort((left, right) => right.timestamp - left.timestamp);

    for (const status of expectedStatuses) {
      await harness.seedStatus(status);
    }
  });

  afterAll(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  beforeEach(() => {
    statusService = new StatusService();
  });

  it("returns persisted story pages in newest-first order", async () => {
    const persistedStatus = await harness.getStatus(
      user.alias,
      expectedStatuses[0].timestamp,
    );
    expect(persistedStatus).toEqual(
      expect.objectContaining({
        user_alias: user.alias,
        timestamp: expectedStatuses[0].timestamp,
        post: expectedStatuses[0].post,
      }),
    );

    const [firstPage, firstHasMore] =
      await statusService.loadMoreStoryItems(
        authToken,
        user.alias,
        pageSize,
        null,
      );

    expect(firstPage.map((status) => status.dto)).toEqual(
      expectedStatuses.slice(0, pageSize),
    );
    expect(firstHasMore).toBe(true);

    const lastItem = firstPage[firstPage.length - 1] as Status;
    const [secondPage, secondHasMore] =
      await statusService.loadMoreStoryItems(
        authToken,
        user.alias,
        pageSize,
        lastItem,
      );

    expect(secondPage.map((status) => status.dto)).toEqual(
      expectedStatuses.slice(pageSize),
    );
    expect(secondHasMore).toBe(false);
  });

  it("returns 500 when a persisted status is malformed", async () => {
    const malformedAlias = harness.alias("malformed-story");
    await harness.seedMalformedStatus(malformedAlias, Date.now());

    expectServerError(
      await captureHttpResult(() =>
        statusService.loadMoreStoryItems(
          authToken,
          malformedAlias,
          pageSize,
          null,
        ),
      ),
    );
  });
});