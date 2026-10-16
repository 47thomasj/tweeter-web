import { AuthToken, Status } from "tweeter-shared";
import { StatusItemPresenter } from "./StatusItemPresenter";
import { PageItemPresenter } from "../PageItemPresenter";

export class StoryPresenter extends StatusItemPresenter {
  protected itemDescription(): string {
    return "story";
  }

  protected getMoreItemsMethod(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[Status[], boolean]> {
    return this.service.loadMoreStoryItems(
      authToken,
      userAlias,
      PageItemPresenter.PAGE_SIZE,
      this.lastItem,
    );
  }
}
