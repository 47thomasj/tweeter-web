import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";
import { Presenter, View } from "./Presenter";

export interface UserNavigationView extends View {
  setDisplayedUser: (user: User) => void;
  navigate: (url: string) => void;
}

export class UserNavigationPresenter extends Presenter<UserNavigationView> {
  private _userService: UserService;
  private _authToken: AuthToken;

  private _displayedUser: User;

  public constructor(view: UserNavigationView, authToken: AuthToken, displayedUser: User) {
    super(view);
    this._userService = new UserService();
    this._authToken = authToken;
    this._displayedUser = displayedUser;
  }

  public async navigateToUser(eventTarget: string, featurePath: string) {
    await this.doFailureReportingOperation(async () => {
      const alias = this.extractAlias(eventTarget);

      const toUser = await this._userService.getUser(this._authToken!, alias);

      if (toUser) {
        if (!toUser.equals(this._displayedUser)) {
          this.view.setDisplayedUser(toUser);
          this.view.navigate(`${featurePath}/${toUser.alias}`);
        }
      }
    }, "get user");
  }

  public extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  };
}
