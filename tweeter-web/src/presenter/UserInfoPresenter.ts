import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model.service/UserService";

export interface UserInfoView {
  setDisplayedUser: (user: User) => void;
  navigate: (url: string) => void;
  displayInfoMessage: (message: string, timeout: number) => string;
  displayErrorMessage: (message: string) => void;
  deleteMessage: (message: string) => void;
  setIsFollower: (isFollower: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export class UserInfoPresenter {
  private view: UserInfoView;
  private userService: UserService;

  private _currentUser: User;
  private _authToken: AuthToken;

  private _followerCount: number = 0;
  private _followeeCount: number = 0;

  public constructor(view: UserInfoView, currentUser: User, authToken: AuthToken) {
    this.view = view;
    this.userService = new UserService();
    this._currentUser = currentUser;
    this._authToken = authToken;
  }

  public get followerCount(): number {
    return this._followerCount;
  }

  public get followeeCount(): number {
    return this._followeeCount;
  }

  public async unfollowUser(displayedUser: User) {
    var unfollowingUserToast = "";
    try {
      this.view.setIsLoading(true);
      unfollowingUserToast = this.view.displayInfoMessage(
        `Unfollowing ${displayedUser.name}...`,
        0,
      );

      const [followerCount, followeeCount] = await this._unfollow(
        this._authToken!,
        displayedUser,
      );

      this.view.setIsFollower(false);
      this._followerCount = followerCount;
      this._followeeCount = followeeCount;
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to unfollow user because of exception: ${error}`,
      );
    } finally {
      this.view.deleteMessage(unfollowingUserToast);
      this.view.setIsLoading(false);
    }
  }

  private async _unfollow(
    authToken: AuthToken,
    userToUnfollow: User,
  ): Promise<[followerCount: number, followeeCount: number]> {
    // Pause so we can see the unfollow message. Remove when connected to the server
    await new Promise((f) => setTimeout(f, 2000));

    // TODO: Call the server

    const followerCount = await this.userService.getFollowerCount(
      authToken,
      userToUnfollow,
    );
    const followeeCount = await this.userService.getFolloweeCount(
      authToken,
      userToUnfollow,
    );

    return [followerCount, followeeCount];
  }

  public async followUser(displayedUser: User) {
    var followingUserToast = "";

    try {
      this.view.setIsLoading(true);
      followingUserToast = this.view.displayInfoMessage(
        `Following ${displayedUser.name}...`,
        0,
      );

      const [followerCount, followeeCount] = await this.userService.follow(
        this._authToken!,
        displayedUser,
      );

      this.view.setIsFollower(true);
      this._followerCount = followerCount;
      this._followeeCount = followeeCount;
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to follow user because of exception: ${error}`,
      );
    } finally {
      this.view.deleteMessage(followingUserToast);
      this.view.setIsLoading(false);
    }
  } 


  public _getBaseUrl(): string {
    const segments = location.pathname.split("/@");
    return segments.length > 1 ? segments[0] : "/";
  };


  public switchToLoggedInUser() {
    this.view.setDisplayedUser(this._currentUser!);
    this.view.navigate(`${this._getBaseUrl()}/${this._currentUser!.alias}`);
  }

  public async setNumbFollowers(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    try {
      this._followerCount = await this.userService.getFollowerCount(authToken, displayedUser);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followers count because of exception: ${error}`,
      );
    }
  };

  public async setNumbFollowees(
    authToken: AuthToken,
    displayedUser: User,
  ): Promise<void> {
    try {
      this._followeeCount = await this.userService.getFolloweeCount(authToken, displayedUser);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followees count because of exception: ${error}`,
      );
    }
  };

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User,
  ): Promise<void> {
    try {
      if (currentUser === displayedUser) {
        this.view.setIsFollower(false);
      } else {
        this.view.setIsFollower(await this.userService.getIsFollowerStatus(authToken, currentUser, displayedUser));
      }
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to determine follower status because of exception: ${error}`,
      );
    }
  };
}
