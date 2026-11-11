// Partially written by AI.

import {
  AuthToken,
  FakeData,
  PagedStatusItemRequest,
  Status,
} from "tweeter-shared";
import { ServerFacade } from "../ServerFascade";
import { Service } from "./Service";

export class StatusService implements Service {
  private serverFacade = new ServerFacade();

  public async loadMoreFeedItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null,
  ): Promise<[Status[], boolean]> {
    const request: PagedStatusItemRequest = {
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastItem?.dto ?? null,
    };

    return this.serverFacade.loadMoreFeedItems(request);
  }

  public async loadMoreStoryItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null,
  ): Promise<[Status[], boolean]> {
    // TODO: Replace with the result of calling server
    return FakeData.instance.getPageOfStatuses(lastItem, pageSize);
  }

  public async postStatus(
    authToken: AuthToken,
    newStatus: Status,
  ): Promise<void> {
    // Pause so we can see the logging out message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server to post the status
  }
}
