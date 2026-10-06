import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";

export interface ItemView {
  addItems: (items: User[]) => void;
  displayErrorMessage: (message: string) => void;
  itemFactory: (item: any) => React.ReactNode;
}
export abstract class ItemPresenter {
  private _hasMoreItems: boolean = true;
  private _lastItem: User | null = null;

  private _view: ItemView;
  private userService: UserService;

  protected constructor(view: ItemView) {
    this._view = view;
    this.userService = new UserService();
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }
  protected get view(): ItemView {
    return this._view;
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
