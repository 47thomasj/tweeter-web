import { AuthToken, User } from "tweeter-shared";
import { Presenter, View } from "./Presenter";
import { UserService } from "../model.service/UserService";
import { Service } from "../model.service/Service";

export interface PageItemView<T> extends View {
  addItems: (items: T[]) => void;
}

export abstract class PageItemPresenter<T, U extends Service> extends Presenter<
  PageItemView<T>
> {
  public static readonly PAGE_SIZE = 10;

  private userService: UserService;
  private _service: U;
  private _hasMoreItems: boolean = true;
  private _lastItem: T | null = null;

  protected constructor(view: PageItemView<T>) {
    super(view);
    this.userService = new UserService();
    this._service = this.serviceFactory();
  }

  protected abstract serviceFactory(): U;

  protected get service(): U {
    return this._service;
  }

  public get hasMoreItems(): boolean {
    return this._hasMoreItems;
  }
  protected get lastItem(): T | null {
    return this._lastItem;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }
  protected set lastItem(value: T | null) {
    this._lastItem = value;
  }

  public async loadMoreItems(authToken: AuthToken, userAlias: string) {
    await this.doFailureReportingOperation(async () => {
      const [newItems, hasMore] = await this.getMoreItemsMethod(
        authToken,
        userAlias,
      );

      this.hasMoreItems = hasMore;
      this.lastItem =
        newItems.length > 0 ? newItems[newItems.length - 1] : null;
      this.view.addItems(newItems);
    }, `load ${this.itemDescription()}`);
  }

  protected abstract itemDescription(): string;
  protected abstract getMoreItemsMethod(
    authToken: AuthToken,
    userAlias: string,
  ): Promise<[T[], boolean]>;

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
