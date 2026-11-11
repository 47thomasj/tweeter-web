/** @jest-environment node */ // Partially written by AI.

/**
 * Using the Jest testing framework, write an INTEGRATION test for your client-side Service that returns a user's story pages (i.e., StatusService). Service methods are async so your tests will need to await the results of calling service methods before testing expectations. Your test should test the results of a successful story retrieval.
 */

import { AuthToken, FakeData, Status } from "tweeter-shared";
import { StatusService } from "../../src/model/service/StatusService";

describe("loadMoreStoryItems", () => {
  const pageSize = 10;

  let statusService: StatusService;
  let authToken: AuthToken;
  let userAlias: string;
  let expectedStatuses: Status[];
  let expectedHasMore: boolean;

  beforeEach(() => {
    const fakeData = FakeData.instance;
    const user = fakeData.firstUser;

    if (user === null) {
      throw new Error("Expected fake data to contain a user");
    }

    statusService = new StatusService();
    authToken = fakeData.authToken;
    userAlias = user.alias;
    [expectedStatuses, expectedHasMore] = fakeData.getPageOfStatuses(
      null,
      pageSize,
    );
  });

  it("returns the requested story page and whether more stories are available", async () => {
    const [statuses, hasMore] = await statusService.loadMoreStoryItems(
      authToken,
      userAlias,
      pageSize,
      null,
    );

    expect(statuses).toEqual(expectedStatuses);
    expect(hasMore).toBe(expectedHasMore);
  });
});