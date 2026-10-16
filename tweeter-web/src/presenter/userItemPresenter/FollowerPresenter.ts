import { AuthToken, User } from "tweeter-shared";
import { UserItemPresenter } from "./UserItemPresenter";
import { PageItemPresenter } from "../PageItemPresenter";

export class FollowerPresenter extends UserItemPresenter {
  protected itemDescription(): string {
    return "followers";
  }

  protected getMoreItemsMethod(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[User[], boolean]> {
    return this.service.loadMoreFollowers(
      authToken,
      userAlias,
      PageItemPresenter.PAGE_SIZE,
      this.lastItem,
    );
  }
}
