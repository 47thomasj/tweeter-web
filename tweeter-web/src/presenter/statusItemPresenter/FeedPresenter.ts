import { AuthToken, Status } from "tweeter-shared";
import { StatusItemPresenter } from "./StatusItemPresenter";
import { PageItemPresenter } from "../PageItemPresenter";

export class FeedPresenter extends StatusItemPresenter {
  protected itemDescription(): string {
    return "feed";
  }

  protected getMoreItemsMethod(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[Status[], boolean]> {
    return this.service.loadMoreFeedItems(
      authToken,
      userAlias,
      PageItemPresenter.PAGE_SIZE,
      this.lastItem,
    );
  }
}
