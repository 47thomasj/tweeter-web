import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../../model.service/UserService";
import { Presenter, View } from "../Presenter";

export interface UserItemView extends View {
  addItems: (items: User[]) => void;
}
export abstract class UserItemPresenter extends Presenter<UserItemView> {
  private _hasMoreItems: boolean = true;
  private _lastItem: User | null = null;

  private userService: UserService;

  protected constructor(view: UserItemView) {
    super(view);
    this.userService = new UserService();
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }
  protected get view(): UserItemView {
    return this.view;
  }
  protected get lastItem(): User | null {
    return this._lastItem;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }
  protected set lastItem(value: User | null) {
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
