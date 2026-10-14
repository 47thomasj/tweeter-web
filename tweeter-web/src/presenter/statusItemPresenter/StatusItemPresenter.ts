import { AuthToken, Status, User } from "tweeter-shared";
import { UserService } from "../../model.service/UserService";
import { Presenter, View } from "../Presenter";

export interface StatusItemView extends View {
  addItems: (items: Status[]) => void;
}
export abstract class StatusItemPresenter extends Presenter<StatusItemView> {
  private _hasMoreItems: boolean = true;
  private _lastItem: Status | null = null;

  private userService: UserService;

  protected constructor(view: StatusItemView) {
    super(view);
    this.userService = new UserService();
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }

  protected get lastItem(): Status | null {
    return this._lastItem;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }
  protected set lastItem(value: Status | null) {
    this._lastItem = value;
  }

  public abstract loadMoreItems(authToken: AuthToken, userAlias: string): void;

  public reset() {
    this._hasMoreItems = true;
    this._lastItem = null;
  }

  public async getUser(
    authToken: AuthToken,
    alias: string,
  ): Promise<User | null> {
    return this.userService.getUser(authToken, alias);
  }
}
