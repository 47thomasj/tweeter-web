import { AuthToken, User } from "tweeter-shared";
import { UserItemPresenter } from "./UserItemPresenter";
import { PageItemPresenter } from "../PageItemPresenter";

export class FolloweePresenter extends UserItemPresenter {
  protected itemDescription(): string {
    return "followees";
  }

  protected getMoreItemsMethod(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[User[], boolean]> {
    return this.service.loadMoreFollowees(
      authToken,
      userAlias,
      PageItemPresenter.PAGE_SIZE,
      this.lastItem,
    );
  }
}
