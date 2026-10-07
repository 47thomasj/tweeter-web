import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";

export interface UserNavigationView {
  setDisplayedUser: (user: User) => void;
  navigate: (url: string) => void;
  displayErrorMessage: (message: string) => void;
}

export class UserNavigationPresenter {
  private _view: UserNavigationView;
  private _userService: UserService;
  private _authToken: AuthToken;

  private _displayedUser: User;

  public constructor(view: UserNavigationView, authToken: AuthToken, displayedUser: User) {
    this._view = view;
    this._userService = new UserService();
    this._authToken = authToken;
    this._displayedUser = displayedUser;
  }

  public async navigateToUser(eventTarget: string, featurePath: string) {
    try {
      const alias = this.extractAlias(eventTarget);

      const toUser = await this._userService.getUser(this._authToken!, alias);

      if (toUser) {
        if (!toUser.equals(this._displayedUser)) {
          this._view.setDisplayedUser(toUser);
          this._view.navigate(`${featurePath}/${toUser.alias}`);
        }
      }
    } catch (error) {
      this._view.displayErrorMessage(`Failed to get user because of exception: ${error}`);
    }
  }

  public extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  };
}
